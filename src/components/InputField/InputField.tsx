import { useId, type ComponentProps, type ReactNode } from 'react'

import { AlertIcon } from '../../icons'
import { cx } from '../../lib/cx'

export type InputFieldVariant = 'outline' | 'filled'
export type InputFieldSize = 'md' | 'lg'

export interface InputFieldProps extends Omit<ComponentProps<'input'>, 'size'> {
  /** Names the field. Required, so an input can never ship without an accessible name. */
  label: string
  /** Hides the label visually and keeps it for assistive technology, e.g. on a search box. */
  hideLabel?: boolean
  /** Help text under the field. Read out together with the label. */
  description?: ReactNode
  /** Error message. Passing one marks the field invalid and announces the message. */
  error?: ReactNode
  /**
   * - `outline`: the default, for forms on the page background.
   * - `filled`: a quieter field for dense forms inside cards and panels.
   */
  variant?: InputFieldVariant
  /** `md` is 44px tall. `lg` is 52px, for the one field a screen is about. */
  size?: InputFieldSize
  /** Content before the value, such as a currency code. Follows the reading direction. */
  startAdornment?: ReactNode
  /** Content after the value, such as a unit. */
  endAdornment?: ReactNode
}

const controlBase = [
  'flex items-center gap-2 px-3.5 transition-colors',
  'outline-offset-2 outline-focus has-[:focus-visible]:outline-2',
  'has-[:disabled]:cursor-not-allowed has-[:disabled]:border-default has-[:disabled]:bg-disabled',
].join(' ')

const variants: Record<InputFieldVariant, string> = {
  outline: 'rounded-control border bg-surface',
  // No box to mark the edge, so a bottom rule keeps the 3:1 boundary WCAG 1.4.11 asks for.
  filled: 'rounded-t-control border-b bg-subtle',
}

const sizes: Record<InputFieldSize, { control: string; text: string }> = {
  md: { control: 'h-control-md', text: 'text-body' },
  lg: { control: 'h-control-lg', text: 'text-body-lg' },
}

export function InputField({
  label,
  hideLabel = false,
  description,
  error,
  variant = 'outline',
  size = 'md',
  startAdornment,
  endAdornment,
  id: idProp,
  className,
  required,
  'aria-describedby': describedByProp,
  ...props
}: InputFieldProps) {
  const generatedId = useId()
  const id = idProp ?? generatedId
  const descriptionId = `${id}-description`
  const errorId = `${id}-error`
  const startId = `${id}-start`
  const endId = `${id}-end`
  const invalid = Boolean(error)

  // Text adornments ("AED") are part of what the field means, so they are read with it.
  const describedBy =
    [
      describedByProp,
      typeof startAdornment === 'string' && startId,
      typeof endAdornment === 'string' && endId,
      description && descriptionId,
      invalid && errorId,
    ]
      .filter(Boolean)
      .join(' ') || undefined

  return (
    <div className={className}>
      <label htmlFor={id} className={cx('mb-1.5 block text-label text-default', hideLabel && 'sr-only')}>
        {label}
        {required && (
          <span aria-hidden="true" className="text-danger">
            {' *'}
          </span>
        )}
      </label>

      <div
        className={cx(
          controlBase,
          variants[variant],
          sizes[size].control,
          invalid ? 'border-danger' : 'border-control hover:border-control-hover',
        )}
      >
        {startAdornment && (
          <span id={startId} className={cx('shrink-0 text-muted', sizes[size].text)}>
            {startAdornment}
          </span>
        )}
        <input
          {...props}
          id={id}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cx(
            'min-w-0 flex-1 self-stretch bg-transparent text-default outline-none',
            'placeholder:text-muted disabled:cursor-not-allowed disabled:text-disabled',
            sizes[size].text,
          )}
        />
        {endAdornment && (
          <span id={endId} className={cx('shrink-0 text-muted', sizes[size].text)}>
            {endAdornment}
          </span>
        )}
      </div>

      {description && (
        <p id={descriptionId} className="mt-1.5 text-body-sm text-muted">
          {description}
        </p>
      )}

      {/* Always in the DOM, so a message that appears later is announced. */}
      <div aria-live="polite">
        {invalid && (
          <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-body-sm text-danger">
            <AlertIcon size={16} className="mt-0.5" />
            <span>{error}</span>
          </p>
        )}
      </div>
    </div>
  )
}
