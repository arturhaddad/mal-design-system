/**
 * The contrast contract of the token set.
 *
 * Every foreground token is listed with the backgrounds it is allowed to sit
 * on and the WCAG 2.2 ratio that pairing must hold. `tokens.test.ts` checks the
 * whole list in both themes, and the Colour page in Storybook renders it live.
 */

type Rgb = readonly [number, number, number]

/** `#fff` becomes `#ffffff`. Anything else is returned as it came. */
export function longHex(value: string): string {
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value.trim())
  return short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toLowerCase() : value
}

/**
 * Parses `#rrggbb`, the `#rgb` a minifier shortens it to, or the
 * `rgb(r, g, b)` form returned by `getComputedStyle`.
 */
export function parseColor(value: string): Rgb {
  const hex = /^#([0-9a-f]{6})$/i.exec(longHex(value).trim())
  if (hex) {
    const int = Number.parseInt(hex[1], 16)
    return [(int >> 16) & 255, (int >> 8) & 255, int & 255]
  }

  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(value.trim())
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]

  throw new Error(`Unsupported colour format: "${value}"`)
}

function relativeLuminance([r, g, b]: Rgb): number {
  const [lr, lg, lb] = [r, g, b].map((channel) => {
    const srgb = channel / 255
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
}

/** WCAG 2.x contrast ratio between two colours, from 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [relativeLuminance(parseColor(a)), relativeLuminance(parseColor(b))].sort(
    (x, y) => y - x,
  )
  return (lighter + 0.05) / (darker + 0.05)
}

export interface ContrastPair {
  /** CSS variable of the text, border or outline colour. */
  foreground: `--${string}`
  /** CSS variable of the background it sits on. */
  background: `--${string}`
  /** 4.5 for text (WCAG 1.4.3), 3 for control boundaries and focus rings (1.4.11). */
  minimum: 4.5 | 3
}

const text = (foreground: string, ...backgrounds: string[]): ContrastPair[] =>
  backgrounds.map((background) => ({
    foreground: `--text-color-${foreground}`,
    background: `--background-color-${background}`,
    minimum: 4.5,
  }))

const boundary = (foreground: `--${string}`, ...backgrounds: string[]): ContrastPair[] =>
  backgrounds.map((background) => ({
    foreground,
    background: `--background-color-${background}`,
    minimum: 3,
  }))

export const contrastPairs: ContrastPair[] = [
  ...text('default', 'canvas', 'surface', 'subtle'),
  ...text('muted', 'canvas', 'surface', 'subtle'),
  ...text('brand', 'canvas', 'surface', 'brand-subtle'),
  ...text('success', 'surface', 'success-subtle'),
  ...text('danger', 'canvas', 'surface', 'danger-subtle'),
  ...text('warning', 'surface', 'warning-subtle'),
  ...text('on-action', 'action', 'action-hover', 'action-active'),
  ...text('on-danger', 'danger', 'danger-hover'),
  ...text('on-brand-strong', 'brand-strong'),
  ...text('on-brand-strong-muted', 'brand-strong'),
  ...boundary('--border-color-control', 'canvas', 'surface'),
  ...boundary('--border-color-danger', 'canvas', 'surface'),
  ...boundary('--outline-color-focus', 'canvas', 'surface'),
]
