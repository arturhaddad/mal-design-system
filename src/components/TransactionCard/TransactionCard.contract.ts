/**
 * What a TransactionCard is on every platform: the transaction it shows and
 * the options it takes.
 *
 * The web component and the React Native component both extend this type, so
 * the two cannot drift apart. Each adds what only its platform has, such as
 * `href` on the web and `onPress` in the app.
 */
export type TransactionCardVariant = 'card' | 'row'
export type TransactionDirection = 'incoming' | 'outgoing'
export type TransactionStatus = 'completed' | 'pending' | 'failed'

/** Every string the component can render on its own. Override them to translate. */
export interface TransactionCardLabels {
  /** Read before the amount by screen readers, where the "+" sign is silent. */
  incoming: string
  /** Read before the amount by screen readers, where the minus sign is silent. */
  outgoing: string
  pending: string
  failed: string
}

export const defaultTransactionCardLabels: TransactionCardLabels = {
  incoming: 'Received',
  outgoing: 'Paid',
  pending: 'Pending',
  failed: 'Failed',
}

export interface TransactionCardContract {
  /** Who the money went to or came from. */
  title: string
  /** Category or note, e.g. "Groceries". */
  description?: string
  /** Amount in minor units (fils for AED), always positive. `direction` gives it a sign. */
  amount: number
  /** ISO 4217 currency code. */
  currency: string
  direction: TransactionDirection
  /** `completed` shows no badge: the settled state is the default and needs no label. */
  status?: TransactionStatus
  /** When the transaction happened. */
  date: Date | string | number
  /**
   * - `card`: a bordered surface that stands on its own, e.g. "latest transaction".
   * - `row`: a borderless line for transaction lists.
   */
  variant?: TransactionCardVariant
  /** BCP 47 locale for the amount and the date. */
  locale?: string
  /** IANA time zone for the date. Fixed, so server and client render the same text. */
  timeZone?: string
  labels?: Partial<TransactionCardLabels>
}
