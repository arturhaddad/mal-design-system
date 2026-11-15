import { minorUnitDigits } from '../../lib/money'

/** One direction between two currencies, at the rate and fee the product will honour. */
export interface TransferCorridor {
  /** ISO 4217 code of the currency the sender pays in. */
  sourceCurrency: string
  /** ISO 4217 code of the currency the recipient gets. */
  targetCurrency: string
  /** How many units of the target currency one unit of the source buys. */
  rate: number
  /** Flat fee in minor units of the source currency. Defaults to none. */
  fee?: number
}

/** Every figure of a transfer. Amounts are in minor units of their own currency. */
export interface TransferQuote {
  sourceCurrency: string
  targetCurrency: string
  rate: number
  /** What leaves the sender's account, in the source currency. */
  sendAmount: number
  /** In the source currency. */
  fee: number
  /** What is left to convert once the fee is out, in the source currency. */
  convertedAmount: number
  /** What arrives, in the target currency. */
  receiveAmount: number
}

/**
 * Removes the noise of floating point before rounding: 4.35 × 100 is
 * 434.99999999999994, and the answer is 435. Fourteen significant digits
 * leave room for any amount a person can send.
 */
const exact = (value: number) => Number(value.toPrecision(14))

/** Moves an amount between currencies, in minor units and before rounding. */
function convert(amount: number, from: string, to: string, factor: number): number {
  const shift = minorUnitDigits(to) - minorUnitDigits(from)
  const value = amount * factor
  // Dividing by a power of ten is exact where multiplying by its inverse is not.
  return exact(shift >= 0 ? value * 10 ** shift : value / 10 ** -shift)
}

const isUsable = (rate: number) => Number.isFinite(rate) && rate > 0

/**
 * The quote for an amount the sender pays. The fee comes out first and the
 * rest is converted.
 *
 * What arrives is rounded down, so a quote never promises more than is
 * delivered. An amount that does not cover the fee, or a rate that is not a
 * positive number, quotes nothing.
 */
export function quoteFromSend({
  sourceCurrency,
  targetCurrency,
  rate,
  fee = 0,
  sendAmount,
}: TransferCorridor & { sendAmount: number }): TransferQuote {
  const convertedAmount = Math.max(0, sendAmount - fee)
  const receiveAmount = isUsable(rate) ? Math.floor(convert(convertedAmount, sourceCurrency, targetCurrency, rate)) : 0

  return { sourceCurrency, targetCurrency, rate, sendAmount, fee, convertedAmount, receiveAmount }
}

/**
 * The quote for an amount the recipient should get. It works back to what has
 * to be converted and adds the fee on top.
 *
 * What is sent is rounded up, so the amount asked for always arrives.
 */
export function quoteFromReceive({
  sourceCurrency,
  targetCurrency,
  rate,
  fee = 0,
  receiveAmount,
}: TransferCorridor & { receiveAmount: number }): TransferQuote {
  if (!isUsable(rate) || receiveAmount <= 0) {
    return { sourceCurrency, targetCurrency, rate, sendAmount: 0, fee, convertedAmount: 0, receiveAmount: 0 }
  }

  const convertedAmount = Math.ceil(convert(receiveAmount, targetCurrency, sourceCurrency, 1 / rate))

  return { sourceCurrency, targetCurrency, rate, sendAmount: convertedAmount + fee, fee, convertedAmount, receiveAmount }
}
