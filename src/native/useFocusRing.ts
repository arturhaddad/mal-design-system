import { useState } from 'react'

import { useTheme } from './useTheme'

/** A browser also focuses on a mouse click. There, only keyboard focus gets the ring. */
function isKeyboardFocus(event: { target: unknown }): boolean {
  const target = event.target as { matches?: (selector: string) => boolean } | null
  return target?.matches?.(':focus-visible') ?? true
}

/**
 * The focus ring of the system, for anything pressable: spread `handlers` on
 * the `Pressable` and add `style` to its styles.
 */
export function useFocusRing() {
  const theme = useTheme()
  const [visible, setVisible] = useState(false)

  return {
    handlers: {
      onFocus: (event: { target: unknown }) => setVisible(isKeyboardFocus(event)),
      onBlur: () => setVisible(false),
    },
    style: visible
      ? ({ outlineStyle: 'solid', outlineWidth: 2, outlineOffset: 2, outlineColor: theme.outline.focus } as const)
      : null,
  }
}
