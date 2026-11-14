import { describe, expect, it } from 'vitest'

import { currencySymbol, formatMoney, minorUnitDigits, parseMoney } from './money'

describe('minorUnitDigits', () => {
  it('follows ISO 4217, including three-decimal Gulf currencies', () => {
    expect(minorUnitDigits('AED')).toBe(2)
    expect(minorUnitDigits('KWD')).toBe(3)
    expect(minorUnitDigits('JPY')).toBe(0)
  })
})

describe('currencySymbol', () => {
  it('writes the currency the way the locale does', () => {
    expect(currencySymbol('AED', 'en-AE')).toBe('AED')
    expect(currencySymbol('AED', 'ar-AE')).toContain('د.إ')
  })
})

describe('formatMoney', () => {
  it('formats minor units for the locale', () => {
    expect(formatMoney(1_250_00, 'AED')).toBe('AED 1,250.00')
    expect(formatMoney(1_250_500, 'KWD', { locale: 'en-KW' })).toContain('1,250.500')
  })

  it('uses a real minus sign and an explicit plus when asked', () => {
    expect(formatMoney(-42_50, 'AED', { signDisplay: 'exceptZero' })).toBe('−AED 42.50')
    expect(formatMoney(42_50, 'AED', { signDisplay: 'exceptZero' })).toBe('+AED 42.50')
  })
})

describe('parseMoney', () => {
  it('reads plain and grouped amounts into minor units', () => {
    expect(parseMoney('1250', 'AED')).toBe(1_250_00)
    expect(parseMoney('1,250.5', 'AED')).toBe(1_250_50)
    expect(parseMoney(' 0.07 ', 'AED')).toBe(7)
    expect(parseMoney('.5', 'AED')).toBe(50)
    expect(parseMoney('12.', 'AED')).toBe(12_00)
  })

  it('reads Arabic-Indic digits and separators', () => {
    expect(parseMoney('١٢٥٠٫٥٠', 'AED')).toBe(1_250_50)
    expect(parseMoney('١٬٢٥٠', 'AED')).toBe(1_250_00)
  })

  it('treats an empty field as zero', () => {
    expect(parseMoney('', 'AED')).toBe(0)
  })

  it('rejects anything that is not a non-negative amount', () => {
    expect(parseMoney('abc', 'AED')).toBeNull()
    expect(parseMoney('-5', 'AED')).toBeNull()
    expect(parseMoney('1.2.3', 'AED')).toBeNull()
    expect(parseMoney('.', 'AED')).toBeNull()
  })

  it('rejects more decimals than the currency has', () => {
    expect(parseMoney('1.005', 'AED')).toBeNull()
    expect(parseMoney('1.005', 'KWD')).toBe(1_005)
  })
})
