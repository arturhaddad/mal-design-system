/**
 * Reads the two token files. The contrast tests and the React Native build
 * both start here, so the CSS has one reader and stays the only source.
 */
import { readFileSync } from 'node:fs'

export type Declarations = Record<string, string>

export interface TokenSource {
  /** Tier 1: the raw `--mal-*` values. */
  primitives: Declarations
  /** Tier 2, as declared for the light theme. */
  light: Declarations
  /** Tier 2 overrides declared under `[data-theme='dark']`. */
  dark: Declarations
}

/** Reads `--name: value;` declarations out of a block of CSS. */
export function declarations(css: string): Declarations {
  return Object.fromEntries(
    [...css.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]),
  )
}

/** Returns the body of the first rule whose prelude starts with `prelude`. */
export function block(css: string, prelude: string): string {
  const start = css.indexOf(`${prelude} {`)
  if (start === -1) throw new Error(`No "${prelude}" block found`)
  return css.slice(start, css.indexOf('\n}', start))
}

/** Splits the text of primitives.css and semantic.css into the two tiers. */
export function parseTokens(primitivesCss: string, semanticCss: string): TokenSource {
  return {
    primitives: declarations(primitivesCss),
    light: declarations(block(semanticCss, '@theme static')),
    dark: declarations(block(semanticCss, "[data-theme='dark']")),
  }
}

/** The tokens as they are on disk. */
export function readTokenSource(): TokenSource {
  const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8')
  return parseTokens(read('./primitives.css'), read('./semantic.css'))
}

/** Follows a semantic token to the primitive value it points at. */
export function resolveToken(primitives: Declarations, theme: Declarations, token: string): string {
  const value = theme[token]
  if (!value) throw new Error(`Unknown token ${token}`)
  const reference = /^var\((--[\w-]+)\)$/.exec(value)
  if (!reference) return value
  const primitive = primitives[reference[1]]
  if (!primitive) throw new Error(`${token} points at ${reference[1]}, which is not a primitive`)
  return primitive
}
