import { useId } from 'react'

import { cx } from '../lib/cx'

/**
 * A star-and-cross lattice, one of the oldest tilings in Islamic geometry.
 * Purely decorative: it is drawn in the current text colour at low opacity
 * and hidden from assistive technology.
 */
export function KhatamPattern({ className }: { className?: string }) {
  const patternId = useId()

  return (
    <svg aria-hidden="true" focusable="false" className={cx('pointer-events-none absolute inset-0 size-full', className)}>
      <defs>
        <pattern id={patternId} width="40" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M40 20l-5.86 5.86v8.28h-8.28L20 40l-5.86-5.86H5.86v-8.28L0 20l5.86-5.86V5.86h8.28L20 0l5.86 5.86h8.28v8.28L40 20Z"
            fill="none"
            stroke="currentColor"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  )
}
