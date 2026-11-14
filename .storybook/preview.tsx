import type { Preview } from '@storybook/react-vite'

import '../src/fonts.css'
import '../src/styles.css'
import './docs.css'

import { malTheme } from './theme'

const preview: Preview = {
  tags: ['autodocs'],

  // Two toolbar switches. Every story can be viewed in both themes and both directions.
  globalTypes: {
    theme: {
      description: 'Colour theme',
      toolbar: {
        title: 'Theme',
        icon: 'contrast',
        dynamicTitle: true,
        items: [
          { value: 'light', title: 'Light theme', icon: 'sun' },
          { value: 'dark', title: 'Dark theme', icon: 'moon' },
        ],
      },
    },
    direction: {
      description: 'Reading direction',
      toolbar: {
        title: 'Direction',
        icon: 'transfer',
        dynamicTitle: true,
        items: [
          { value: 'ltr', title: 'Left to right' },
          { value: 'rtl', title: 'Right to left' },
        ],
      },
    },
  },
  initialGlobals: { theme: 'light', direction: 'ltr' },

  decorators: [
    (Story, { globals, viewMode }) => (
      <div
        data-theme={globals.theme}
        dir={globals.direction}
        lang={globals.direction === 'rtl' ? 'ar' : 'en'}
        className={`bg-canvas p-6 text-default ${viewMode === 'story' ? 'min-h-screen' : ''}`}
      >
        <Story />
      </div>
    ),
  ],

  parameters: {
    layout: 'fullscreen',
    backgrounds: { disable: true },
    // An accessibility violation fails the story's test, in the UI and in CI.
    a11y: { test: 'error' },
    controls: {
      expanded: true,
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
    docs: { theme: malTheme },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Getting started',
          'Foundations',
          ['Colour', 'Typography', 'Spacing and radius'],
          'Components',
          ['Button', 'InputField', 'TransactionCard', 'ZakatCalculator', 'Badge'],
        ],
      },
    },
  },
}

export default preview
