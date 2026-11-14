import { create } from 'storybook/theming'

/**
 * Storybook's own chrome, matched to the system's light theme. Storybook's
 * theme API takes literal values, so these mirror the primitives by hand.
 */
export const malTheme = create({
  base: 'light',

  brandTitle: 'Mal Design System',
  brandUrl: 'https://github.com/arturhaddad/mal-design-system',
  brandTarget: '_blank',

  fontBase: '"Inter Variable", Inter, ui-sans-serif, system-ui, sans-serif',

  colorPrimary: '#0b763a',
  colorSecondary: '#0b763a',

  appBg: '#f5f7f7',
  appContentBg: '#ffffff',
  appPreviewBg: '#f5f7f7',
  appBorderColor: '#dce1e1',
  appBorderRadius: 12,

  textColor: '#020b0e',
  textMutedColor: '#5a6668',
  textInverseColor: '#ffffff',

  barBg: '#ffffff',
  barTextColor: '#5a6668',
  barHoverColor: '#0b763a',
  barSelectedColor: '#0b763a',

  inputBg: '#ffffff',
  inputBorder: '#808b8d',
  inputTextColor: '#020b0e',
  inputBorderRadius: 12,
})
