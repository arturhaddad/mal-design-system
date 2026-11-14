/** 2.5%, the rate on wealth held for one lunar year. */
export const DEFAULT_ZAKAT_RATE = 0.025

export interface ZakatInput {
  /** Total zakatable assets, in minor units. */
  assets: number
  /** Debts due now, in minor units. Subtracted from the assets. */
  liabilities?: number
  /** The nisab threshold, in minor units. Wealth below it owes no zakat. */
  nisab: number
  /** Share of the wealth owed. Some scholars use 2.577% when counting a solar year. */
  rate?: number
}

export interface ZakatResult {
  /** Assets minus liabilities, never below zero. In minor units. */
  zakatableWealth: number
  nisab: number
  rate: number
  /** Whether the wealth reaches the nisab. */
  isDue: boolean
  /** Zakat owed in minor units, rounded to the nearest unit. Zero when not due. */
  zakatDue: number
}

/**
 * Works out zakat on wealth. Pure and integer-only, so it can be tested and
 * reused outside the component, e.g. on the server.
 *
 * Once wealth reaches the nisab, the rate applies to all of it, not only to
 * the part above the threshold.
 */
export function calculateZakat({
  assets,
  liabilities = 0,
  nisab,
  rate = DEFAULT_ZAKAT_RATE,
}: ZakatInput): ZakatResult {
  const zakatableWealth = Math.max(0, assets - liabilities)
  const isDue = zakatableWealth > 0 && zakatableWealth >= nisab

  return {
    zakatableWealth,
    nisab,
    rate,
    isDue,
    zakatDue: isDue ? Math.round(zakatableWealth * rate) : 0,
  }
}
