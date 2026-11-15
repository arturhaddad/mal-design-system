import { formatMoney } from '../../lib/money'
import type { TransactionDirection } from './TransactionCard.contract'

export interface TransactionText {
  /** The signed amount, e.g. "+AED 18,500.00". */
  amount: string
  /** Day and time in the given time zone, or `null` when the date cannot be parsed. */
  date: string | null
  /** The same instant as an ISO string, for `<time dateTime>`. */
  dateTime: string | null
}

/**
 * The text of a transaction, formatted for a locale. It has no markup, so the
 * web and the React Native components print exactly the same words.
 */
export function formatTransaction({
  amount,
  currency,
  direction,
  date,
  locale,
  timeZone,
}: {
  amount: number
  currency: string
  direction: TransactionDirection
  date: Date | string | number
  locale: string
  timeZone: string
}): TransactionText {
  const when = new Date(date)
  // Data comes from an API. A date that cannot be parsed drops the timestamp instead of crashing the list.
  const hasValidDate = !Number.isNaN(when.getTime())

  return {
    amount: formatMoney(direction === 'incoming' ? amount : -amount, currency, { locale, signDisplay: 'exceptZero' }),
    date: hasValidDate
      ? new Intl.DateTimeFormat(locale, {
          day: 'numeric',
          month: 'short',
          hour: 'numeric',
          minute: '2-digit',
          timeZone,
        }).format(when)
      : null,
    dateTime: hasValidDate ? when.toISOString() : null,
  }
}
