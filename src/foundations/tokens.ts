/**
 * Reads the token values straight from the loaded stylesheets, so the
 * Foundations pages can never drift from the CSS they document.
 */

export interface Token {
  /** The CSS variable, e.g. `--background-color-canvas`. */
  name: string
  /** Declared value in the light theme, e.g. `var(--mal-ink-50)`. */
  light: string
  /** Declared value in the dark theme. Falls back to the light value. */
  dark: string
}

const DARK_SELECTOR = /\[data-theme=["']?dark["']?\]/

/** Every token whose name starts with `prefix`, in source order. */
export function readTokens(prefix: string): Token[] {
  const light = new Map<string, string>()
  const dark = new Map<string, string>()

  const visit = (rules: CSSRuleList) => {
    for (const rule of rules) {
      if (rule instanceof CSSStyleRule) {
        const target = DARK_SELECTOR.test(rule.selectorText) ? dark : rule.selectorText.includes(':root') ? light : null
        if (!target) continue
        for (const property of rule.style) {
          if (property.startsWith(prefix)) target.set(property, rule.style.getPropertyValue(property).trim())
        }
      } else if ('cssRules' in rule) {
        visit((rule as CSSGroupingRule).cssRules)
      }
    }
  }

  for (const sheet of document.styleSheets) {
    try {
      visit(sheet.cssRules)
    } catch {
      // A cross-origin stylesheet. None of the tokens live there.
    }
  }

  return [...light].map(([name, value]) => ({ name, light: value, dark: dark.get(name) ?? value }))
}

/** `var(--mal-ink-50)` becomes `ink-50`. */
export function primitiveName(value: string): string {
  return /var\(--mal-([\w-]+)\)/.exec(value)?.[1] ?? value
}

/** Resolves a declared value such as `var(--mal-ink-50)` to its colour, e.g. `#f5f7f7`. */
export function resolveValue(value: string): string {
  const reference = /var\((--[\w-]+)\)/.exec(value)
  if (!reference) return value
  return getComputedStyle(document.documentElement).getPropertyValue(reference[1]).trim()
}

const UTILITY_PREFIX: Record<string, string> = {
  '--background-color-': 'bg-',
  '--text-color-': 'text-',
  '--border-color-': 'border-',
  '--outline-color-': 'outline-',
  '--radius-': 'rounded-',
  '--text-': 'text-',
}

/** The Tailwind utility a token generates: `--background-color-canvas` becomes `bg-canvas`. */
export function utilityName(token: string): string {
  const prefix = Object.keys(UTILITY_PREFIX).find((candidate) => token.startsWith(candidate))
  return prefix ? UTILITY_PREFIX[prefix] + token.slice(prefix.length) : token
}
