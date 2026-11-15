/**
 * Turns the CSS tokens into the theme React Native reads.
 *
 * The CSS stays the source and nothing here holds a value. The command in
 * build-native-tokens.ts writes the result to src/tokens/native.ts, and
 * native.test.ts fails while that file and the CSS disagree.
 *
 * Node runs this file as it is, so its imports carry the `.ts` extension.
 */
import { longHex } from '../src/tokens/contrast.ts'
import { resolveToken } from '../src/tokens/source.ts'
import type { Declarations, TokenSource } from '../src/tokens/source.ts'

type Leaf = string | number

interface Tree {
  [key: string]: Leaf | Tree
}

export interface NativeTheme {
  /** What both themes share: type, spacing, control heights and radius. */
  scale: Tree
  /** The colours of each theme. */
  light: Tree
  dark: Tree
}

type Kind = 'colour' | 'length' | 'fontWeight' | 'letterSpacing'

interface Rule {
  /** Matches a token name. Its captures are handed to `path`. */
  pattern: RegExp
  path: (...parts: string[]) => string[]
  kind: Kind
}

const camelCase = (name: string) => name.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase())

const COLOUR = /^--(background|text|border|outline)-color-(.+)$/

/** The whole naming rule. The first pattern that matches a token decides where it goes. */
const RULES: Rule[] = [
  { pattern: COLOUR, path: (group, name) => [group, camelCase(name)], kind: 'colour' },
  { pattern: /^--spacing$/, path: () => ['spacing'], kind: 'length' },
  { pattern: /^--spacing-control-(.+)$/, path: (name) => ['control', camelCase(name)], kind: 'length' },
  { pattern: /^--radius-(.+)$/, path: (name) => ['radius', camelCase(name)], kind: 'length' },
  { pattern: /^--font-weight-(.+)$/, path: (name) => ['fontWeight', camelCase(name)], kind: 'fontWeight' },
  {
    pattern: /^--text-(.+)--line-height$/,
    path: (name) => ['textStyle', camelCase(name), 'lineHeight'],
    kind: 'length',
  },
  {
    pattern: /^--text-(.+)--font-weight$/,
    path: (name) => ['textStyle', camelCase(name), 'fontWeight'],
    kind: 'fontWeight',
  },
  {
    pattern: /^--text-(.+)--letter-spacing$/,
    path: (name) => ['textStyle', camelCase(name), 'letterSpacing'],
    kind: 'letterSpacing',
  },
  { pattern: /^--text-((?:(?!--).)+)$/, path: (name) => ['textStyle', camelCase(name), 'fontSize'], kind: 'length' },
]

/** Tokens left out on purpose. Any other token without a rule is an error. */
const LEFT_OUT = [
  /^--font-sans$/, // A fallback stack. React Native takes one family: see `fontFamily`.
  /^--shadow-/, // A CSS box shadow has no single native equivalent.
  /^--default-transition-/, // CSS transitions.
]

const isLeftOut = (token: string) => LEFT_OUT.some((pattern) => pattern.test(token))
const isColour = (token: string) => COLOUR.test(token)

function place(token: string): { path: string[]; kind: Kind } {
  for (const { pattern, path, kind } of RULES) {
    const match = pattern.exec(token)
    if (match) return { path: path(...match.slice(1)), kind }
  }
  throw new Error(`No React Native mapping for ${token}`)
}

/** Where a token lives in the native theme: `--background-color-action-hover` is `background.actionHover`. */
export function nativePath(token: string): string[] {
  return place(token).path
}

/** The web's root font size. A CSS pixel is one density-independent pixel. */
const ROOT_FONT_SIZE = 16

const round = (value: number) => Math.round(value * 1000) / 1000

/** `0.75rem` or `12px` as a number of density-independent pixels, the unit of every React Native size. */
export function toDp(value: string): number {
  const length = /^(-?\d*\.?\d+)(rem|px)$/.exec(value)
  if (!length) throw new Error(`Cannot convert "${value}" to density-independent pixels`)
  return round(Number(length[1]) * (length[2] === 'rem' ? ROOT_FONT_SIZE : 1))
}

function toColour(value: string): string {
  const hex = longHex(value).toLowerCase()
  if (!/^#[0-9a-f]{6}$/.test(hex)) throw new Error(`Cannot convert "${value}" to a hex colour`)
  return hex
}

/** React Native takes the weight as a string, in steps of a hundred. */
function toFontWeight(value: string): string {
  if (!/^[1-9]00$/.test(value)) throw new Error(`Cannot convert "${value}" to a font weight`)
  return value
}

/** React Native's letter spacing is absolute, so an `em` value is multiplied by the font size. */
function toLetterSpacing(value: string, fontSize: number): number {
  const em = /^(-?\d*\.?\d+)em$/.exec(value)
  if (!em) throw new Error(`Cannot convert "${value}" to a letter spacing`)
  return round(Number(em[1]) * fontSize)
}

/**
 * `'Inter Variable', 'Inter'` becomes `Inter`. The first name is what the web
 * font package calls its variable file. An app registers the plain family.
 */
function staticFamily(stack: string): string {
  const families = stack.split(',').map((name) => name.trim().replace(/^['"]|['"]$/g, ''))
  const family = families.find((name) => !name.endsWith(' Variable'))
  if (!family) throw new Error(`No static font family in "${stack}"`)
  return family
}

function fontFamilies(primitives: Declarations): Tree {
  const families: Tree = {}
  for (const [token, stack] of Object.entries(primitives)) {
    const name = /^--mal-font-(.+)$/.exec(token)?.[1]
    if (name) families[camelCase(name)] = staticFamily(stack)
  }
  return families
}

function put(tree: Tree, [key, ...rest]: string[], value: Leaf): void {
  if (rest.length === 0) tree[key] = value
  else put((tree[key] ??= {}) as Tree, rest, value)
}

export function buildNativeTheme({ primitives, light, dark }: TokenSource): NativeTheme {
  for (const token of Object.keys(dark)) {
    if (!isColour(token) && !isLeftOut(token)) {
      throw new Error(`The dark theme overrides ${token}, which is not a colour`)
    }
  }

  const colours = (theme: Declarations) => {
    const tree: Tree = {}
    for (const token of Object.keys(theme).filter(isColour)) {
      put(tree, nativePath(token), toColour(resolveToken(primitives, theme, token)))
    }
    return tree
  }

  /** `--text-title--line-height` belongs to the text style whose size is `--text-title`. */
  const fontSizeOf = (token: string) => {
    const size = token.slice(0, token.lastIndexOf('--'))
    if (!light[size]) throw new Error(`${token} has no ${size} size`)
    return toDp(light[size])
  }

  const scale: Tree = { fontFamily: fontFamilies(primitives) }
  for (const token of Object.keys(light)) {
    if (isColour(token) || isLeftOut(token)) continue
    const { path, kind } = place(token)
    const value = resolveToken(primitives, light, token)
    // Only the properties of a text style have a font size to belong to. The other tokens never read it.
    const fontSize = path[0] === 'textStyle' && path[2] !== 'fontSize' ? fontSizeOf(token) : 0

    if (kind === 'fontWeight') put(scale, path, toFontWeight(value))
    else if (kind === 'letterSpacing') put(scale, path, toLetterSpacing(value, fontSize))
    else put(scale, path, toDp(value))
  }

  return { scale, light: colours(light), dark: colours({ ...light, ...dark }) }
}

const HEADER = `/*
 * Generated by \`pnpm tokens:native\` from primitives.css and semantic.css.
 * Do not edit it: change the CSS and run the command again. \`pnpm test\`
 * fails while this file and the CSS disagree.
 *
 * The same tokens for React Native, which cannot read CSS variables. Names
 * are kept, in camelCase: \`--background-color-action-hover\` is
 * \`background.actionHover\`. Colours are resolved to hex, and sizes are
 * numbers in density-independent pixels.
 */`

function literal(value: Leaf | Tree, indent: string): string {
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return `'${value}'`
  return `{\n${entries(value, `${indent}  `)}${indent}}`
}

function entries(tree: Tree, indent: string): string {
  return Object.entries(tree)
    .map(([key, value]) => `${indent}${key}: ${literal(value, indent)},\n`)
    .join('')
}

/** The text of src/tokens/native.ts. */
export function renderNativeTokens(source: TokenSource): string {
  const { scale, light, dark } = buildNativeTheme(source)
  return `${HEADER}

/** What both themes share. */
const scale = ${literal(scale, '')} as const

export const themes = {
  light: {
    ...scale,
${entries(light, '    ')}  },
  dark: {
    ...scale,
${entries(dark, '    ')}  },
} as const

export type ThemeName = keyof typeof themes
export type Theme = (typeof themes)[ThemeName]
`
}
