import { describe, expect, it } from 'vitest'

import { currencySymbol, formatAmountInput, formatMoney, minorUnitDigits, parseMoney } from './money'

describe('minorUnitDigits', () => {
  it('follows ISO 4217, including three-decimal Gulf currencies', () => {
    expect(minorUnitDigits('AED')).toBe(2)
    expect(minorUnitDigits('KWD')).toBe(3)
    expect(minorUnitDigits('JPY')).toBe(0)
  })

  it('follows ISO 4217 where the runtime does not', () => {
    // Intl reports how a currency is usually displayed, which varies by runtime:
    // Node gives the Pakistani rupee 2 decimals and Chromium gives it 0.
    expect(minorUnitDigits('PKR')).toBe(2)
    // Intl shows the Iraqi dinar and the Iranian rial without decimals. ISO 4217 gives them 3 and 2.
    expect(minorUnitDigits('IQD')).toBe(3)
    expect(minorUnitDigits('IRR')).toBe(2)
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

  it('prints the decimals of the ledger, not the ones the runtime prefers', () => {
    expect(formatMoney(27_850_00, 'PKR')).toBe('PKR\u00a027,850.00')
    expect(formatMoney(1_250_00, 'IRR')).toBe('IRR\u00a01,250.00')
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

describe('formatAmountInput', () => {
  it('writes an amount the way a person would type it, with the decimals of the currency', () => {
    expect(formatAmountInput(27_850_00, 'PKR')).toBe('27,850.00')
    expect(formatAmountInput(15_025, 'JPY')).toBe('15,025')
    expect(formatAmountInput(30_750, 'KWD')).toBe('30.750')
    expect(formatAmountInput(5, 'USD')).toBe('0.05')
  })

  it('writes text that parseMoney reads back as the same amount', () => {
    for (const [amount, currency] of [[27_850_00, 'PKR'], [15_025, 'JPY'], [30_750, 'KWD'], [1_234_567_89, 'AED']] as const) {
      expect(parseMoney(formatAmountInput(amount, currency), currency)).toBe(amount)
    }
  })
})
