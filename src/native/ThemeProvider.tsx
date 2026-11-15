import type { ReactNode } from 'react'

import type { ThemeName } from '../tokens/native'
import { ThemeContext } from './useTheme'

/**
 * Fixes the theme for the components below it, for a screen that is always
 * dark or an app with its own theme setting. Without it, components follow
 * the device.
 */
export function ThemeProvider({ theme, children }: { theme: ThemeName; children: ReactNode }) {
  return <ThemeContext value={theme}>{children}</ThemeContext>
}
