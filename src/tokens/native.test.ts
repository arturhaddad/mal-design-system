import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { buildNativeTheme, nativePath, renderNativeTokens, toDp } from '../../scripts/native-tokens.ts'
import { contrastPairs, contrastRatio } from './contrast'
import { themes } from './native'
import { parseTokens, readTokenSource } from './source'

const primitivesCss = `
:root {
  --mal-ink-0: #FFF;
  --mal-ink-900: #0e171a;
  --mal-ink-950: #020b0e;
  --mal-emerald-400: #2bd673;
  --mal-emerald-700: #0b763a;
  --mal-radius-md: 0.75rem;
  --mal-radius-full: 9999px;
  --mal-font-latin: 'Inter Variable', 'Inter';
  --mal-font-arabic: 'IBM Plex Sans Arabic';
}
`

/** A cut-down semantic.css. `light` and `dark` add declarations to each theme. */
const semanticCss = ({ light = '', dark = '' } = {}) => `
@theme static {
  --color-*: initial;
  --background-color-surface: var(--mal-ink-0);
  --background-color-action-hover: var(--mal-emerald-400);
  --text-color-on-action: var(--mal-ink-950);
  --border-color-control: var(--mal-ink-900);
  --outline-color-focus: var(--mal-emerald-700);
  --font-sans: var(--mal-font-latin), var(--mal-font-arabic), sans-serif;
  --text-display: 2.5rem;
  --text-display--line-height: 3rem;
  --text-display--font-weight: 700;
  --text-display--letter-spacing: -0.03em;
  --text-body-sm: 0.875rem;
  --text-body-sm--line-height: 1.25rem;
  --text-body-sm--font-weight: 400;
  --font-weight-semibold: 600;
  --spacing: 0.25rem;
  --spacing-control-md: 2.75rem;
  --radius-control: var(--mal-radius-md);
  --radius-pill: var(--mal-radius-full);
  --shadow-raised: 0 1px 2px rgb(2 11 14 / 0.05);
  --default-transition-duration: 150ms;
  ${light}
}

[data-theme='dark'] {
  color-scheme: dark;
  --background-color-surface: var(--mal-ink-900);
  --background-color-action-hover: var(--mal-emerald-400);
  --text-color-on-action: var(--mal-ink-950);
  --border-color-control: var(--mal-ink-0);
  --outline-color-focus: var(--mal-emerald-400);
  --shadow-raised: 0 0 0 1px rgb(255 255 255 / 0.04);
  ${dark}
}
`

describe('toDp', () => {
  it.each([
    ['0.25rem', 4],
    ['0.875rem', 14],
    ['2.75rem', 44],
    ['9999px', 9999],
  ])('turns %s into %d density-independent pixels', (value, dp) => {
    expect(toDp(value)).toBe(dp)
  })

  it.each(['calc(1rem + 2px)', '50%', '2em', '1.5', 'var(--mal-gap)'])('refuses %s instead of guessing', (value) => {
    expect(() => toDp(value)).toThrow('Cannot convert')
  })
})

describe('nativePath', () => {
  it.each([
    ['--background-color-action-hover', ['background', 'actionHover']],
    ['--text-color-on-brand-strong-muted', ['text', 'onBrandStrongMuted']],
    ['--border-color-control', ['border', 'control']],
    ['--outline-color-focus', ['outline', 'focus']],
    ['--spacing', ['spacing']],
    ['--spacing-control-md', ['control', 'md']],
    ['--radius-card', ['radius', 'card']],
    ['--font-weight-semibold', ['fontWeight', 'semibold']],
    ['--text-body-lg', ['textStyle', 'bodyLg', 'fontSize']],
    ['--text-body-lg--line-height', ['textStyle', 'bodyLg', 'lineHeight']],
    ['--text-body-lg--font-weight', ['textStyle', 'bodyLg', 'fontWeight']],
    ['--text-body-lg--letter-spacing', ['textStyle', 'bodyLg', 'letterSpacing']],
  ])('keeps the name of %s, in camelCase', (token, path) => {
    expect(nativePath(token)).toEqual(path)
  })

  it.each(['--z-index-dialog', '--spacing-gutter', '--text-display--text-transform'])(
    'has no place for %s',
    (token) => {
      expect(() => nativePath(token)).toThrow(`No React Native mapping for ${token}`)
    },
  )
})

describe('buildNativeTheme', () => {
  it('resolves every token to a value React Native can use', () => {
    expect(buildNativeTheme(parseTokens(primitivesCss, semanticCss()))).toEqual({
      scale: {
        fontFamily: { latin: 'Inter', arabic: 'IBM Plex Sans Arabic' },
        textStyle: {
          display: { fontSize: 40, lineHeight: 48, fontWeight: '700', letterSpacing: -1.2 },
          bodySm: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
        },
        fontWeight: { semibold: '600' },
        spacing: 4,
        control: { md: 44 },
        radius: { control: 12, pill: 9999 },
      },
      light: {
        background: { surface: '#ffffff', actionHover: '#2bd673' },
        text: { onAction: '#020b0e' },
        border: { control: '#0e171a' },
        outline: { focus: '#0b763a' },
      },
      dark: {
        background: { surface: '#0e171a', actionHover: '#2bd673' },
        text: { onAction: '#020b0e' },
        border: { control: '#ffffff' },
        outline: { focus: '#2bd673' },
      },
    })
  })

  it('refuses a token it has no mapping for, so a new kind of token is never dropped in silence', () => {
    const source = parseTokens(primitivesCss, semanticCss({ light: '--z-index-dialog: 10;' }))
    expect(() => buildNativeTheme(source)).toThrow('No React Native mapping for --z-index-dialog')
  })

  it.each([
    ['a length', '--spacing-control-xl: calc(3rem + 2px);'],
    ['a colour', '--text-color-on-action: oklch(60% 0.2 150);'],
    ['a font weight', '--font-weight-book: 450;'],
    ['a letter spacing', '--text-display--letter-spacing: normal;'],
  ])('refuses %s it cannot convert', (_kind, declaration) => {
    const source = parseTokens(primitivesCss, semanticCss({ light: declaration }))
    expect(() => buildNativeTheme(source)).toThrow('Cannot convert')
  })

  it('refuses a colour that does not point at a primitive', () => {
    const source = parseTokens(primitivesCss, semanticCss({ light: '--text-color-on-action: var(--mal-missing);' }))
    expect(() => buildNativeTheme(source)).toThrow('which is not a primitive')
  })

  it('refuses a dark override that is not a colour, because sizes are shared by both themes', () => {
    const source = parseTokens(primitivesCss, semanticCss({ dark: '--radius-control: var(--mal-radius-full);' }))
    expect(() => buildNativeTheme(source)).toThrow('The dark theme overrides --radius-control, which is not a colour')
  })

  it('refuses a text style property with no font size to belong to', () => {
    const source = parseTokens(primitivesCss, semanticCss({ light: '--text-quote--line-height: 2rem;' }))
    expect(() => buildNativeTheme(source)).toThrow('--text-quote--line-height has no --text-quote size')
  })

  it('refuses a font stack with no static family', () => {
    const variableOnly = primitivesCss.replace("'Inter Variable', 'Inter'", "'Inter Variable'")
    expect(() => buildNativeTheme(parseTokens(variableOnly, semanticCss()))).toThrow('No static font family')
  })
})

describe('the committed React Native theme', () => {
  const source = readTokenSource()

  it('is the file the generator writes from the CSS as it is now', () => {
    const committed = readFileSync(new URL('./native.ts', import.meta.url), 'utf8')
    expect(committed, 'Run `pnpm tokens:native` and commit the result.').toBe(renderNativeTokens(source))
  })

  it('exports the same values the generator built', () => {
    const { scale, light, dark } = buildNativeTheme(source)
    expect(themes).toEqual({ light: { ...scale, ...light }, dark: { ...scale, ...dark } })
  })

  describe.each(['light', 'dark'] as const)('contrast in the %s theme', (name) => {
    const colour = (token: string) => {
      const [group, key] = nativePath(token)
      return (themes[name] as unknown as Record<string, Record<string, string>>)[group][key]
    }

    it.each(contrastPairs)('$foreground on $background holds $minimum:1', ({ foreground, background, minimum }) => {
      expect(contrastRatio(colour(foreground), colour(background))).toBeGreaterThanOrEqual(minimum)
    })
  })
})
