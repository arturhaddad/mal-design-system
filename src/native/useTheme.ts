import { createContext, useContext } from 'react'
import { useColorScheme } from 'react-native'

import { themes } from '../tokens/native'
import type { Theme, ThemeName } from '../tokens/native'

/** The theme a `ThemeProvider` fixed, or `null` to follow the device. */
export const ThemeContext = createContext<ThemeName | null>(null)

/** The tokens of the current theme: the nearest `ThemeProvider`, or else the device setting. */
export function useTheme(): Theme {
  const fixed = useContext(ThemeContext)
  const device = useColorScheme()
  return themes[fixed ?? (device === 'dark' ? 'dark' : 'light')]
}
