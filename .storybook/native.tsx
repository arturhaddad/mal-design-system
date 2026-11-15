import type { Decorator } from '@storybook/react-vite'

import { ThemeProvider } from '../src/native/ThemeProvider'

import './native.css'

/**
 * For the React Native stories. The Theme switch in the toolbar picks the
 * native theme, as the device setting would in an app, and the story is held
 * to the width of a phone.
 */
export const onAPhone: Decorator = (Story, { globals }) => (
  <ThemeProvider theme={globals.theme === 'dark' ? 'dark' : 'light'}>
    <div className="max-w-sm">
      <Story />
    </div>
  </ThemeProvider>
)
