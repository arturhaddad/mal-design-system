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

/** Maps Arabic-Indic digits and separators to their ASCII equivalents. */
function toAsciiNumber(input: string): string {
  return input
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - ARABIC_INDIC_ZERO))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - EXTENDED_ARABIC_INDIC_ZERO))
    .replace(/٫/g, '.')
    .replace(/[٬,\s]/g, '')
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
