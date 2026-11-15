import { describe, expect, it } from 'vitest'

import { parseMoney } from '../../lib/money'
import { quoteFromReceive, quoteFromSend } from './quoteTransfer'

// Example rates. USD and PKR have 2 decimals, JPY has none and KWD has 3.
const usdToPkr = { sourceCurrency: 'USD', targetCurrency: 'PKR', rate: 278.5 }
const usdToJpy = { sourceCurrency: 'USD', targetCurrency: 'JPY', rate: 150.25 }
const usdToKwd = { sourceCurrency: 'USD', targetCurrency: 'KWD', rate: 0.3075 }

describe('quoteFromSend', () => {
  it('converts what is sent at the rate', () => {
    expect(quoteFromSend({ ...usdToPkr, sendAmount: 100_00 })).toEqual({
      ...usdToPkr,
      sendAmount: 100_00,
      fee: 0,
      convertedAmount: 100_00,
      receiveAmount: 27_850_00,
    })
  })

  it('takes the fee out before converting, so fee and converted amount add up to what is sent', () => {
    const quote = quoteFromSend({ ...usdToPkr, sendAmount: 100_00, fee: 5_00 })

    expect(quote.convertedAmount).toBe(95_00)
    expect(quote.receiveAmount).toBe(26_457_50)
    expect(quote.fee + quote.convertedAmount).toBe(quote.sendAmount)
  })

  it('follows the decimals of each currency', () => {
    expect(quoteFromSend({ ...usdToJpy, sendAmount: 100_00 }).receiveAmount).toBe(15_025)
    expect(quoteFromSend({ ...usdToKwd, sendAmount: 100_00 }).receiveAmount).toBe(30_750)
  })

  it('rounds what arrives down, so a quote never promises more than is delivered', () => {
    // 1.00 USD at 150.259 is 150.259 yen.
    expect(quoteFromSend({ ...usdToJpy, rate: 150.259, sendAmount: 1_00 }).receiveAmount).toBe(150)
  })

  it('does not lose a unit to floating point', () => {
    // 4.35 * 100 is 434.99999999999994 in floating point. The answer is 435 yen.
    expect(quoteFromSend({ ...usdToJpy, rate: 100, sendAmount: 4_35 }).receiveAmount).toBe(435)
  })

  it('converts nothing when the amount does not cover the fee', () => {
    for (const sendAmount of [0, 3_00, 5_00]) {
      const quote = quoteFromSend({ ...usdToPkr, sendAmount, fee: 5_00 })

      expect(quote.convertedAmount).toBe(0)
      expect(quote.receiveAmount).toBe(0)
    }
  })

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('quotes nothing at a rate of %s', (rate) => {
    expect(quoteFromSend({ ...usdToPkr, rate, sendAmount: 100_00 }).receiveAmount).toBe(0)
  })
})

describe('quoteFromReceive', () => {
  it('works back from what should arrive to what has to be sent', () => {
    expect(quoteFromReceive({ ...usdToPkr, receiveAmount: 27_850_00 })).toEqual({
      ...usdToPkr,
      sendAmount: 100_00,
      fee: 0,
      convertedAmount: 100_00,
      receiveAmount: 27_850_00,
    })
  })

  it('adds the fee on top of the converted amount', () => {
    const quote = quoteFromReceive({ ...usdToPkr, receiveAmount: 26_457_50, fee: 5_00 })

    expect(quote.convertedAmount).toBe(95_00)
    expect(quote.sendAmount).toBe(100_00)
  })

  it('rounds what is sent up, so the amount asked for always arrives', () => {
    // 1,000 yen at 150.25 is 6.6555 dollars.
    const quote = quoteFromReceive({ ...usdToJpy, receiveAmount: 1_000 })

    expect(quote.sendAmount).toBe(6_66)
    expect(quoteFromSend({ ...usdToJpy, sendAmount: quote.sendAmount }).receiveAmount).toBeGreaterThanOrEqual(1_000)
  })

  it('keeps the amount the person asked for', () => {
    expect(quoteFromReceive({ ...usdToJpy, receiveAmount: 1_000 }).receiveAmount).toBe(1_000)
  })

  it('asks for nothing when nothing should arrive, even with a fee', () => {
    expect(quoteFromReceive({ ...usdToPkr, receiveAmount: 0, fee: 5_00 }).sendAmount).toBe(0)
  })

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('quotes nothing at a rate of %s', (rate) => {
    const quote = quoteFromReceive({ ...usdToPkr, rate, receiveAmount: 27_850_00 })

    expect(quote.sendAmount).toBe(0)
    expect(quote.receiveAmount).toBe(0)
  })
})

it('parses as money, whatever comes out', () => {
  // The result goes into a text field, so it must be a whole number of minor units.
  for (const sendAmount of [1, 99, 1_01, 123_45, 9_999_99]) {
    const { receiveAmount } = quoteFromSend({ ...usdToKwd, sendAmount })

    expect(Number.isSafeInteger(receiveAmount)).toBe(true)
    expect(parseMoney(String(receiveAmount / 1000), 'KWD')).toBe(receiveAmount)
  }
})
