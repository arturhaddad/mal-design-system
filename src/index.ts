/**
 * Public API of the Mal design system.
 *
 * Styles are separate: `styles.css`, next to this file, holds the tokens and
 * is loaded once per app.
 */
export * from './components/Badge'
export * from './components/Button'
export * from './components/InputField'
export * from './components/TransactionCard'
export * from './components/ZakatCalculator'
export { currencySymbol, formatMoney, minorUnitDigits, parseMoney } from './lib/money'
export type { FormatMoneyOptions } from './lib/money'
