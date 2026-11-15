import { describe, expect, it } from 'vitest'

import { contrastPairs, contrastRatio, longHex } from './contrast'
import { readTokenSource, resolveToken } from './source'

const { primitives, light, dark } = readTokenSource()

const isColour = (name: string) => /^--(background|text|border|outline)-color-/.test(name)

const themes = { light, dark: { ...light, ...dark } }

const resolve = (theme: Record<string, string>, token: string) => resolveToken(primitives, theme, token)

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
