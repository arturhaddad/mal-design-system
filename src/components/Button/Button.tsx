import type { ComponentProps, MouseEvent, ReactNode } from 'react'

import { SpinnerIcon } from '../../icons'
import { cx } from '../../lib/cx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ComponentProps<'button'> {
  /**
   * Visual weight of the action.
   * - `primary`: the one main action of a view.
   * - `secondary`: an alternative next to a primary.
   * - `ghost`: low-emphasis actions such as "Cancel" or "Reset".
   * - `danger`: actions that destroy or cannot be undone.
   */
  variant?: ButtonVariant
  /** `md` is 44px tall, a comfortable touch target. `sm` is for dense, pointer-first UI. */
  size?: ButtonSize
  /**
   * Shows a spinner and ignores activation. Unlike `disabled`, the button stays
   * focusable, so keyboard and screen reader users are not thrown off it mid-task.
   */
  loading?: boolean
  /** Announced to assistive technology while `loading`. Pass a translated string. */
  loadingLabel?: string
  /** Icon before the label. "Start" follows the reading direction: left in English, right in Arabic. */
  iconStart?: ReactNode
  /** Icon after the label. */
  iconEnd?: ReactNode
  /** Stretches the button to the width of its container. */
  fullWidth?: boolean
}

const base = [
  'relative inline-flex shrink-0 items-center justify-center gap-2',
  'rounded-pill border whitespace-nowrap select-none',
  'transition-colors outline-offset-2 outline-focus focus-visible:outline-2',
  'disabled:cursor-not-allowed disabled:border-transparent disabled:bg-disabled disabled:text-disabled',
  'aria-busy:cursor-progress',
].join(' ')

// Each variant sets every colour property itself. Two utilities never compete for one property.
const variants: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-action text-on-action hover:bg-action-hover active:bg-action-active',
  secondary: 'border-control bg-surface text-default hover:border-control-hover hover:bg-subtle active:bg-subtle',
  ghost: 'border-transparent text-brand hover:bg-brand-subtle active:bg-brand-subtle',
  danger: 'border-transparent bg-danger text-on-danger hover:bg-danger-hover active:bg-danger-hover',
}

const sizes: Record<ButtonSize, string> = {
  // On touch screens a transparent ::after grows the 32px button to a 44px hit area.
  sm: 'h-control-sm px-3 text-label pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5',
  md: 'h-control-md px-5 text-label',
  lg: 'h-control-lg px-6 text-body font-medium',
}

/**
 * Triggers an action. A view has one `primary` button; the other variants step
 * down from it. To navigate, use a link instead.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  loadingLabel = 'Loading',
  iconStart,
  iconEnd,
  fullWidth = false,
  disabled,
  className,
  onClick,
  children,
  ...props
}: ButtonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (loading) {
      // Also stops a type="submit" button from submitting its form twice.
      event.preventDefault()
      return
    }
    onClick?.(event)
  }

  return (
    <button
      {...props}
      type={type}
      disabled={disabled}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      onClick={handleClick}
      className={cx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
    >
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <SpinnerIcon size={size === 'sm' ? 16 : 20} />
          <span className="sr-only">{loadingLabel}</span>
        </span>
      )}
      {/* The label keeps its space while loading, so the button never changes width. */}
      <span className={cx('contents', loading && '*:opacity-0')}>
        {iconStart && <span className="-ms-0.5 inline-flex">{iconStart}</span>}
        <span>{children}</span>
        {iconEnd && <span className="-me-0.5 inline-flex">{iconEnd}</span>}
      </span>
    </button>
  )
}
