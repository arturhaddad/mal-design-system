import type { MouseEventHandler, ReactNode } from 'react'

import { AlertIcon, ArrowDownLeftIcon, ArrowUpRightIcon, ClockIcon } from '../../icons'
import { cx } from '../../lib/cx'
import { formatMoney } from '../../lib/money'
import { Badge } from '../Badge'

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

export interface TransactionCardProps {
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
  /** Replaces the default direction arrow, e.g. with a merchant category icon. */
  icon?: ReactNode
  /** BCP 47 locale for the amount and the date. */
  locale?: string
  /** IANA time zone for the date. Fixed, so server and client render the same text. */
  timeZone?: string
  labels?: Partial<TransactionCardLabels>
  /** Renders the card as a link to the transaction. */
  href?: string
  /** Renders the card as a button. Ignored when `href` is set. */
  onClick?: MouseEventHandler<HTMLButtonElement>
  className?: string
}

const defaultLabels: TransactionCardLabels = {
  incoming: 'Received',
  outgoing: 'Paid',
  pending: 'Pending',
  failed: 'Failed',
}

const variants: Record<TransactionCardVariant, string> = {
  card: 'rounded-card border border-default bg-surface p-4',
  row: 'rounded-control px-2 py-3',
}

const interactive: Record<TransactionCardVariant, string> = {
  card: 'hover:border-control',
  row: 'hover:bg-subtle',
}

/**
 * One transaction: who, how much, when, and whether it went through. Amounts
 * arrive as integers in minor units and are formatted for the locale.
 */
export function TransactionCard({
  title,
  description,
  amount,
  currency,
  direction,
  status = 'completed',
  date,
  variant = 'card',
  icon,
  locale = 'en-AE',
  timeZone = 'Asia/Dubai',
  labels: labelOverrides,
  href,
  onClick,
  className,
}: TransactionCardProps) {
  const labels = { ...defaultLabels, ...labelOverrides }
  const isIncoming = direction === 'incoming'
  const when = new Date(date)

  const formattedAmount = formatMoney(isIncoming ? amount : -amount, currency, { locale, signDisplay: 'exceptZero' })
  const formattedDate = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(when)

  // Only phrasing elements below: the same markup has to be valid inside <a> and <button>.
  const content = (
    <>
      <span
        className={cx(
          'grid size-10 shrink-0 place-items-center rounded-chip',
          isIncoming ? 'bg-success-subtle text-success' : 'bg-subtle text-muted',
        )}
      >
        {icon ?? (isIncoming ? <ArrowDownLeftIcon /> : <ArrowUpRightIcon />)}
      </span>

      <span className="flex min-w-0 flex-1 flex-col text-start">
        <span className="flex items-center gap-2">
          <span className="truncate text-label text-default">{title}</span>
          {status === 'pending' && (
            <Badge tone="warning" icon={<ClockIcon size={14} />}>
              {labels.pending}
            </Badge>
          )}
          {status === 'failed' && (
            <Badge tone="danger" icon={<AlertIcon size={14} />}>
              {labels.failed}
            </Badge>
          )}
        </span>
        {description && <span className="truncate text-body-sm text-muted">{description}</span>}
      </span>

      <span className="flex shrink-0 flex-col items-end">
        <span
          className={cx(
            'text-label tabular-nums',
            status === 'failed' ? 'text-muted line-through' : isIncoming ? 'text-success' : 'text-default',
          )}
        >
          <span className="sr-only">{labels[direction]} </span>
          {/* <bdi> keeps sign, digits and currency in order inside right-to-left text. */}
          <bdi>{formattedAmount}</bdi>
        </span>
        <time dateTime={when.toISOString()} className="text-body-sm text-muted">
          {formattedDate}
        </time>
      </span>
    </>
  )

  const layout = cx('flex w-full items-center gap-3', variants[variant])
  const focusable = cx(
    layout,
    interactive[variant],
    'cursor-pointer transition-colors outline-offset-2 outline-focus focus-visible:outline-2',
    className,
  )

  if (href) {
    return (
      <a href={href} className={focusable}>
        {content}
      </a>
    )
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={focusable}>
        {content}
      </button>
    )
  }

  return <div className={cx(layout, className)}>{content}</div>
}
