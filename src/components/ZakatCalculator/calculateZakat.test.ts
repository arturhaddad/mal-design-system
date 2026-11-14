import { describe, expect, it } from 'vitest'

import { calculateZakat } from './calculateZakat'

const nisab = 21_000_00

describe('calculateZakat', () => {
  it('charges 2.5% of all zakatable wealth once it reaches the nisab', () => {
    expect(calculateZakat({ assets: 120_000_00, nisab })).toMatchObject({
      zakatableWealth: 120_000_00,
      isDue: true,
      zakatDue: 3_000_00,
    })
  })

  it('owes nothing below the nisab', () => {
    expect(calculateZakat({ assets: 20_999_99, nisab })).toMatchObject({ isDue: false, zakatDue: 0 })
  })

  it('is due exactly at the nisab', () => {
    expect(calculateZakat({ assets: nisab, nisab })).toMatchObject({ isDue: true, zakatDue: 525_00 })
  })

  it('subtracts liabilities before comparing with the nisab', () => {
    expect(calculateZakat({ assets: 30_000_00, liabilities: 10_000_00, nisab })).toMatchObject({
      zakatableWealth: 20_000_00,
      isDue: false,
    })
  })

  it('never reports negative wealth', () => {
    expect(calculateZakat({ assets: 1_000_00, liabilities: 5_000_00, nisab })).toMatchObject({
      zakatableWealth: 0,
      zakatDue: 0,
    })
  })

  it('rounds to the nearest minor unit', () => {
    expect(calculateZakat({ assets: 21_000_33, nisab }).zakatDue).toBe(525_01)
  })

  it('accepts another rate', () => {
    expect(calculateZakat({ assets: 100_000_00, nisab, rate: 0.02577 }).zakatDue).toBe(2_577_00)
  })
})
