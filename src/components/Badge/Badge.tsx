import type { ComponentProps, ReactNode } from 'react'

import { cx } from '../../lib/cx'

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger'

export interface BadgeProps extends ComponentProps<'span'> {
  /** What the badge communicates. Tone is never the only signal: the text says it too. */
  tone?: BadgeTone
  /** Icon before the text. */
  icon?: ReactNode
}

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-subtle text-muted',
  brand: 'bg-brand-subtle text-brand',
  success: 'bg-success-subtle text-success',
  warning: 'bg-warning-subtle text-warning',
  danger: 'bg-danger-subtle text-danger',
}

/** A short status label. Tone adds colour, and the text carries the meaning. */
export function Badge({ tone = 'neutral', icon, className, children, ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={cx(
        'inline-flex items-center gap-1 rounded-pill py-0.5 text-caption whitespace-nowrap',
        icon ? 'ps-1.5 pe-2' : 'px-2',
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}
