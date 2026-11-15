/**
 * The icons the components and their stories use, drawn on a 24px grid with a 1.75px stroke.
 *
 * They are decorative by default (`aria-hidden`): the text beside an icon
 * carries the meaning, so nothing here is announced twice.
 */
import type { ComponentProps, ReactNode } from 'react'

import { cx } from '../lib/cx'

export interface IconProps extends Omit<ComponentProps<'svg'>, 'children'> {
  /** Width and height in pixels. */
  size?: number
}

function Icon({ size = 20, className, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cx('shrink-0', className)}
      {...props}
    >
      {children}
    </svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Icon>
  )
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Icon>
  )
}

export function AlertIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.75v4.75M12 16v.25" />
    </Icon>
  )
}

/** Directional: mirrors in right-to-left text, where "forward" points the other way. */
export function ArrowUpRightIcon({ className, ...props }: IconProps) {
  return (
    <Icon className={cx('rtl:-scale-x-100', className)} {...props}>
      <path d="M7 17 17 7M8.5 7H17v8.5" />
    </Icon>
  )
}

/** Directional: mirrors in right-to-left text. */
export function ArrowDownLeftIcon({ className, ...props }: IconProps) {
  return (
    <Icon className={cx('rtl:-scale-x-100', className)} {...props}>
      <path d="M17 7 7 17M15.5 17H7V8.5" />
    </Icon>
  )
}

export function BagIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 8.5h13l-1 11h-11l-1-11Z" />
      <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
    </Icon>
  )
}

/** The khatam, an eight-pointed star made of two squares, common in Islamic geometry. */
export function KhatamIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3l2.64 2.64h3.72v3.72L21 12l-2.64 2.64v3.72h-3.72L12 21l-2.64-2.64H5.64v-3.72L3 12l2.64-2.64V5.64h3.72L12 3Z" />
      <path d="m9.5 12.25 1.75 1.75 3.5-3.75" />
    </Icon>
  )
}

/** An indeterminate spinner. Motion stops under `prefers-reduced-motion`. */
export function SpinnerIcon({ className, ...props }: IconProps) {
  return (
    <Icon className={cx('animate-spin', className)} {...props}>
      <path d="M12 3.5a8.5 8.5 0 1 1-8.5 8.5" />
    </Icon>
  )
}
