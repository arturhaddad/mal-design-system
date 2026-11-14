/**
 * Money helpers.
 *
 * Amounts cross the component boundary as integers in minor units (fils for
 * AED), the way ledgers store them, so no component ever does float maths on
 * money. How many minor units make one major unit comes from `Intl`, which
 * keeps the three-decimal Gulf currencies (KWD, BHD, OMR) correct for free.
 */

/** Decimal places ISO 4217 gives a currency: 2 for AED, 3 for KWD, 0 for JPY. */
export function minorUnitDigits(currency: string): number {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2
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
  const major = amountMinor / 10 ** minorUnitDigits(currency)
  return (
    new Intl.NumberFormat(locale, { style: 'currency', currency, signDisplay })
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
  const match = /^(\d+)(?:\.(\d*))?$/.exec(normalised)
  if (!match) return null

  const [, whole, fraction = ''] = match
  if (fraction.length > digits) return null

  const minor = Number(whole) * 10 ** digits + Number(fraction.padEnd(digits, '0') || 0)
  return Number.isSafeInteger(minor) ? minor : null
}
