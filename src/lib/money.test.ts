import { describe, expect, it } from 'vitest'

import { currencySymbol, formatAmountInput, formatMoney, maskAmount, minorUnitDigits, parseMoney } from './money'

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

describe('maskAmount', () => {
  // The caret is written as "|" to keep the cases readable.
  const mask = (typed: string, currency = 'USD') => {
    const caret = typed.includes('|') ? typed.indexOf('|') : typed.length
    const result = maskAmount(typed.replace('|', ''), currency, caret)
    return typed.includes('|') ? `${result.text.slice(0, result.caret)}|${result.text.slice(result.caret)}` : result.text
  }

  it('groups thousands as the person types', () => {
    expect(mask('1')).toBe('1')
    expect(mask('1000')).toBe('1,000')
    expect(mask('1,0000')).toBe('10,000')
    expect(mask('1234567.89')).toBe('1,234,567.89')
  })

  it('keeps only digits and one decimal separator', () => {
    expect(mask('a1b2c')).toBe('12')
    expect(mask('10904,00099,2.82')).toBe('10,904,000,992.82')
    expect(mask('1.2.3')).toBe('1.23')
    expect(mask('$ 1,250.50')).toBe('1,250.50')
    expect(mask('abc')).toBe('')
  })

  it('stops at the decimals of the currency', () => {
    expect(mask('1.239')).toBe('1.23')
    expect(mask('1.2399', 'KWD')).toBe('1.239')
    expect(mask('1500.5', 'JPY')).toBe('15,005')
  })

  it('lets a decimal be typed one key at a time', () => {
    expect(mask('12.')).toBe('12.')
    expect(mask('12.5')).toBe('12.5')
    expect(mask('.')).toBe('0.')
    expect(mask('.5')).toBe('0.5')
  })

  it('drops leading zeros', () => {
    expect(mask('007')).toBe('7')
    expect(mask('0')).toBe('0')
    expect(mask('0.50')).toBe('0.50')
  })

  it('reads Arabic-Indic digits and the Arabic decimal separator', () => {
    expect(mask('١٢٣٤٫٥')).toBe('1,234.5')
  })

  it('stops at twelve whole digits, which keeps every amount a safe integer', () => {
    expect(mask('1234567890123456')).toBe('123,456,789,012')
  })

  it('keeps the caret after the same digit when separators move', () => {
    expect(mask('1000|')).toBe('1,000|')
    // A digit typed in the middle of 1,000.00
    expect(mask('1,5|000.00')).toBe('15|,000.00')
    // A digit deleted from 12,345: the comma moves, the caret stays after the 1
    expect(mask('1|,345')).toBe('1|,345')
    expect(mask('1|2345')).toBe('1|2,345')
    // Something that is not kept does not move the caret forward
    expect(mask('12a|3')).toBe('12|3')
    expect(mask('00|7')).toBe('|7')
    expect(mask('.|5')).toBe('0.|5')
  })

  it('writes text that parseMoney reads back', () => {
    for (const typed of ['1000', '1234567.89', '12.', '.5', '0']) {
      expect(parseMoney(mask(typed), 'USD')).not.toBeNull()
    }
    expect(parseMoney(mask('1234567.89'), 'USD')).toBe(1_234_567_89)
  })
})
