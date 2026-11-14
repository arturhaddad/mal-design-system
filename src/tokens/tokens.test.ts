import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { contrastPairs, contrastRatio, longHex } from './contrast'

const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8')

/** Reads `--name: value;` declarations out of a block of CSS. */
function declarations(css: string): Record<string, string> {
  return Object.fromEntries(
    [...css.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]),
  )
}

/** Returns the body of the first rule whose prelude starts with `prelude`. */
function block(css: string, prelude: string): string {
  const start = css.indexOf(`${prelude} {`)
  if (start === -1) throw new Error(`No "${prelude}" block found`)
  return css.slice(start, css.indexOf('\n}', start))
}

const primitives = declarations(read('./primitives.css'))
const semantic = read('./semantic.css')
const light = declarations(block(semantic, '@theme static'))
const dark = declarations(block(semantic, "[data-theme='dark']"))

const isColour = (name: string) => /^--(background|text|border|outline)-color-/.test(name)

const themes = { light, dark: { ...light, ...dark } }

function resolve(theme: Record<string, string>, token: string): string {
  const value = theme[token]
  if (!value) throw new Error(`Unknown token ${token}`)
  const reference = /^var\((--[\w-]+)\)$/.exec(value)
  if (!reference) return value
  const primitive = primitives[reference[1]]
  if (!primitive) throw new Error(`${token} points at ${reference[1]}, which is not a primitive`)
  return primitive
}

describe('contrastRatio', () => {
  it('reads every colour format a build can hand it', () => {
    // The production build minifies #ffffff to #fff, and the Colour page reads the built CSS.
    expect(contrastRatio('#fff', '#000')).toBeCloseTo(21)
    expect(contrastRatio('#FFFFFF', 'rgb(0, 0, 0)')).toBeCloseTo(21)
    expect(contrastRatio('#fff', '#ffffff')).toBe(1)
    expect(longHex('#0aF')).toBe('#00aaff')
    expect(longHex('#0b763a')).toBe('#0b763a')
  })

  it('refuses a format it cannot read, instead of guessing', () => {
    expect(() => contrastRatio('rebeccapurple', '#fff')).toThrow('Unsupported colour format')
  })
})

describe('semantic colour tokens', () => {
  const lightColours = Object.keys(light).filter(isColour)

  it('point at a primitive, never at a raw value', () => {
    for (const theme of [light, dark]) {
      for (const [name, value] of Object.entries(theme)) {
        if (isColour(name)) expect(value, name).toMatch(/^var\(--mal-[\w-]+\)$/)
      }
    }
  })

  it('have a dark value for every light value', () => {
    expect(Object.keys(dark).filter(isColour).sort()).toEqual(lightColours.sort())
  })
})

describe.each(Object.entries(themes))('contrast in the %s theme', (_name, theme) => {
  it.each(contrastPairs)('$foreground on $background holds $minimum:1', ({ foreground, background, minimum }) => {
    const ratio = contrastRatio(resolve(theme, foreground), resolve(theme, background))
    expect(ratio).toBeGreaterThanOrEqual(minimum)
  })
})
