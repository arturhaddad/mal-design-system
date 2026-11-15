import { describe, expect, it } from 'vitest'

import { formatTransaction } from './formatTransaction'

const carrefour = {
  amount: 42_50,
  currency: 'AED',
  direction: 'outgoing',
  date: '2026-11-12T10:42:00Z',
  locale: 'en-AE',
  timeZone: 'Asia/Dubai',
} as const

// Intl separates with no-break spaces and may use a true minus sign, so the patterns allow both.
describe('formatTransaction', () => {
  it('gives outgoing money a minus sign', () => {
    expect(formatTransaction(carrefour).amount).toMatch(/^[-−]AED\s42\.50$/)
  })

  it('gives incoming money a plus sign', () => {
    expect(formatTransaction({ ...carrefour, direction: 'incoming' }).amount).toMatch(/^\+AED\s42\.50$/)
  })

  it('writes the date in the time zone it is given', () => {
    expect(formatTransaction(carrefour).date).toMatch(/^12 Nov, 2:42\sPM$/i)
    expect(formatTransaction({ ...carrefour, timeZone: 'UTC' }).date).toMatch(/^12 Nov, 10:42\sAM$/i)
  })

  it('keeps the instant as an ISO string, for markup that wants a machine-readable date', () => {
    expect(formatTransaction(carrefour).dateTime).toBe('2026-11-12T10:42:00.000Z')
  })

  it('drops a date it cannot parse instead of throwing', () => {
    const text = formatTransaction({ ...carrefour, date: 'not a date' })

    expect(text.date).toBeNull()
    expect(text.dateTime).toBeNull()
    expect(text.amount).toMatch(/42\.50/)
  })
})
