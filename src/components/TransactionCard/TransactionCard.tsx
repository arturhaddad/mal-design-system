import type { MouseEventHandler, ReactNode } from 'react'

import { AlertIcon, ArrowDownLeftIcon, ArrowUpRightIcon, ClockIcon } from '../../icons'
import { cx } from '../../lib/cx'
import { Badge } from '../Badge'
import { formatTransaction } from './formatTransaction'
import { defaultTransactionCardLabels } from './TransactionCard.contract'
import type { TransactionCardContract, TransactionCardVariant } from './TransactionCard.contract'

export type {
  TransactionCardLabels,
  TransactionCardVariant,
  TransactionDirection,
  TransactionStatus,
} from './TransactionCard.contract'

export interface TransactionCardProps extends TransactionCardContract {
  /** Replaces the default direction arrow, e.g. with a merchant category icon. */
  icon?: ReactNode
  /** Renders the card as a link to the transaction. */
  href?: string
  /** Renders the card as a button. Ignored when `href` is set. */
  onClick?: MouseEventHandler<HTMLButtonElement>
  className?: string
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
  const labels = { ...defaultTransactionCardLabels, ...labelOverrides }
  const isIncoming = direction === 'incoming'
  const text = formatTransaction({ amount, currency, direction, date, locale, timeZone })

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
        {/* In a narrow card the badge wraps under the title, so the name is the last thing to truncate. */}
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
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
          <bdi>{text.amount}</bdi>
        </span>
        {text.date && text.dateTime && (
          <time dateTime={text.dateTime} className="text-body-sm text-muted">
            {text.date}
          </time>
        )}
      </span>
    </>
  )

  // min-w-0 lets the card shrink inside a grid or flex parent, where the default minimum is its content.
  const layout = cx('flex w-full min-w-0 items-center gap-3', variants[variant])
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
