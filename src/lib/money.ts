/**
 * Money helpers.
 *
 * Amounts cross the component boundary as integers in minor units (fils for
 * AED), the way ledgers store them, so no component ever does float maths on
 * money. How many minor units make one major unit comes from ISO 4217, which
 * keeps the three-decimal Gulf currencies (KWD, BHD, OMR) correct.
 */

/**
 * The currencies ISO 4217 does not give two decimals. Every other code has two.
 *
 * `Intl` is not the source, although it knows a number of decimals for each
 * currency: that number is how a currency is usually displayed, and it differs
 * between runtimes. Node gives the Pakistani rupee 2 and Chromium gives it 0,
 * which would scale an amount by a hundred between the server and the browser.
 */
const MINOR_UNIT_DIGITS: Record<string, number> = {
  ...Object.fromEntries('BIF CLP DJF GNF ISK JPY KMF KRW PYG RWF UGX UYI VND VUV XAF XOF XPF'.split(' ').map((code) => [code, 0])),
  ...Object.fromEntries('BHD IQD JOD KWD LYD OMR TND'.split(' ').map((code) => [code, 3])),
  CLF: 4,
  UYW: 4,
}

/** Decimal places ISO 4217 gives a currency: 2 for AED, 3 for KWD, 0 for JPY. */
export function minorUnitDigits(currency: string): number {
  return MINOR_UNIT_DIGITS[currency.toUpperCase()] ?? 2
}

/** The currency as the locale writes it: "AED" in English, "د.إ." in Arabic. */
export function currencySymbol(currency: string, locale = 'en-AE'): string {
  const parts = new Intl.NumberFormat(locale, { style: 'currency', currency }).formatToParts(0)
  return parts.find((part) => part.type === 'currency')?.value ?? currency
}

export interface FormatMoneyOptions {
  /** BCP 47 locale. Decides digit grouping, symbol and symbol position. */
  locale?: string
  /** `exceptZero` prefixes positive amounts with "+", for incoming money. */
  signDisplay?: 'auto' | 'exceptZero'
}

/** Formats an amount in minor units, e.g. `formatMoney(425_00, 'AED')` gives "AED 425.00". */
export function formatMoney(
  amountMinor: number,
  currency: string,
  { locale = 'en-AE', signDisplay = 'auto' }: FormatMoneyOptions = {},
): string {
  const digits = minorUnitDigits(currency)
  const major = amountMinor / 10 ** digits
  return (
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      signDisplay,
      // Set by hand, so every runtime prints the decimals the ledger counts in.
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
      .format(major)
      // A real minus sign, not the hyphen Intl emits: it has the width of "+" and digits.
      .replace('-', '−')
  )
}

const ARABIC_INDIC_ZERO = 0x0660
const EXTENDED_ARABIC_INDIC_ZERO = 0x06f0

/** Arabic-Indic digits and the Arabic decimal separator as ASCII, one character for one. */
function toAsciiDigits(input: string): string {
  return input
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - ARABIC_INDIC_ZERO))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - EXTENDED_ARABIC_INDIC_ZERO))
    .replace(/٫/g, '.')
}

function toAsciiNumber(input: string): string {
  return toAsciiDigits(input).replace(/[٬,\s]/g, '')
}

/**
 * Parses what a person typed into minor units.
 *
 * Returns `null` when the text is not a non-negative amount, or has more
 * decimals than the currency allows. An empty field is zero.
 */
export function parseMoney(input: string, currency: string): number | null {
  const normalised = toAsciiNumber(input)
  if (normalised === '') return 0

  const digits = minorUnitDigits(currency)
  // Digits on at least one side of the separator: "12", "12.", "12.5" and ".5" are all amounts.
  const match = /^(\d*)(?:\.(\d*))?$/.exec(normalised)
  if (!match) return null

  const [, whole, fraction = ''] = match
  if (whole === '' && fraction === '') return null
  if (fraction.length > digits) return null

  const minor = Number(whole) * 10 ** digits + Number(fraction.padEnd(digits, '0') || 0)
  return Number.isSafeInteger(minor) ? minor : null
}

/**
 * An amount as text for an input, e.g. "27,850.00": digits only, grouped, with
 * the decimals of the currency and no symbol. It is always written the
 * English way, whatever the locale, because that is what `parseMoney` reads.
 */
export function formatAmountInput(amountMinor: number, currency: string): string {
  const digits = minorUnitDigits(currency)
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(
    amountMinor / 10 ** digits,
  )
}

/** The most whole digits a field takes. */
const MAX_WHOLE_DIGITS = 12
/** Fifteen digits in all keep every amount a safe integer, so a four-decimal currency takes eleven whole digits. */
const MAX_DIGITS = 15

/**
 * What an amount field shows while the person types: digits, grouped in
 * thousands, with one decimal separator and no more decimals than the
 * currency has. Anything else typed or pasted is dropped.
 *
 * It also says where the caret goes. The caret stays after the same digit, so
 * a separator appearing or moving does not push it to the end of the field.
 *
 * Like `formatAmountInput`, it writes the English way, which is what
 * `parseMoney` reads.
 */
export function maskAmount(text: string, currency: string, caret = text.length): { text: string; caret: number } {
  const decimals = minorUnitDigits(currency)
  const maxWhole = Math.min(MAX_WHOLE_DIGITS, MAX_DIGITS - decimals)
  const typed = toAsciiDigits(text)

  let whole = ''
  let fraction = ''
  let hasSeparator = false
  let droppedZero = false
  // How many kept characters sit before the caret.
  let keptBeforeCaret = 0

  for (let index = 0; index < typed.length; index += 1) {
    if (index === caret) keptBeforeCaret = whole.length + Number(hasSeparator) + fraction.length

    const character = typed[index]
    if (character >= '0' && character <= '9') {
      if (hasSeparator) {
        if (fraction.length < decimals) fraction += character
      } else if (character === '0' && whole === '') {
        droppedZero = true
      } else if (whole.length < maxWhole) {
        whole += character
      }
    } else if (character === '.' && !hasSeparator && decimals > 0) {
      // ".5" is "0.5".
      if (whole === '') whole = '0'
      hasSeparator = true
    }
  }
  if (whole === '' && droppedZero) whole = '0'
  const kept = whole.length + Number(hasSeparator) + fraction.length
  if (caret >= typed.length) keptBeforeCaret = kept
  keptBeforeCaret = Math.min(keptBeforeCaret, kept)

  const grouped = whole.replace(/\B(?=(\d{3})+$)/g, ',')
  const masked = hasSeparator ? `${grouped}.${fraction}` : grouped

  // Walk the grouped text until the same number of kept characters is behind the caret.
  let position = 0
  for (let seen = 0; position < masked.length && seen < keptBeforeCaret; position += 1) {
    if (masked[position] !== ',') seen += 1
  }

  return { text: masked, caret: position }
}
