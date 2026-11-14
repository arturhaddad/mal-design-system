import { useId, useRef, useState, type FormEvent } from 'react'

import { KhatamPattern } from '../../icons/KhatamPattern'
import { cx } from '../../lib/cx'
import { currencySymbol, formatMoney, parseMoney } from '../../lib/money'
import { Button } from '../Button'
import { InputField } from '../InputField'
import { calculateZakat, DEFAULT_ZAKAT_RATE, type ZakatResult } from './calculateZakat'

export type ZakatCalculatorVariant = 'detailed' | 'quick'

type FieldName = 'cash' | 'metals' | 'investments' | 'liabilities' | 'wealth'

/**
 * Every string the calculator renders. English is the default; pass
 * translations to localise it. Sentences with values in them are functions,
 * because word order around an amount differs between languages.
 */
export interface ZakatCalculatorLabels {
  title: string
  description: string
  cash: string
  metals: string
  investments: string
  liabilities: string
  liabilitiesHint: string
  wealth: string
  wealthHint: string
  calculate: string
  reset: string
  invalidAmount: string
  dueTitle: string
  dueDetail: (values: { rate: string; wealth: string }) => string
  notDueTitle: string
  notDueDetail: (values: { wealth: string; nisab: string }) => string
  pay: (amount: string) => string
  nisab: (amount: string) => string
  disclaimer: string
}

export interface ZakatCalculatorProps {
  /**
   * The nisab threshold in minor units. The product supplies it, from the
   * day's gold or silver price and the standard its scholars follow. The
   * component holds no religious rule of its own.
   */
  nisab: number
  /** ISO 4217 currency code of every amount. */
  currency: string
  /** Share of zakatable wealth owed. Defaults to 2.5%. */
  rate?: number
  /**
   * - `detailed`: assets and debts entered line by line.
   * - `quick`: one field, for people who already know their zakatable wealth.
   */
  variant?: ZakatCalculatorVariant
  /** BCP 47 locale for amounts and the rate. */
  locale?: string
  labels?: Partial<ZakatCalculatorLabels>
  /** Called with every successful calculation. */
  onCalculate?: (result: ZakatResult) => void
  /** Shows a "Pay" action on the result when zakat is due. */
  onPay?: (result: ZakatResult) => void
  className?: string
}

const defaultLabels: ZakatCalculatorLabels = {
  title: 'Zakat calculator',
  description: 'Estimate the zakat on wealth you have held for one lunar year.',
  cash: 'Cash and bank balances',
  metals: 'Gold and silver',
  investments: 'Investments and shares',
  liabilities: 'Debts due now',
  liabilitiesHint: 'Subtracted from your assets.',
  wealth: 'Zakatable wealth',
  wealthHint: 'Your assets minus the debts due now.',
  calculate: 'Calculate zakat',
  reset: 'Reset',
  invalidAmount: 'Enter an amount using digits, for example 1250.50.',
  dueTitle: 'Zakat due',
  dueDetail: ({ rate, wealth }) => `${rate} of ${wealth} in zakatable wealth.`,
  notDueTitle: 'No zakat due',
  notDueDetail: ({ wealth, nisab }) => `Your zakatable wealth of ${wealth} is below the nisab of ${nisab}.`,
  pay: (amount) => `Pay ${amount}`,
  nisab: (amount) => `Nisab threshold: ${amount}.`,
  disclaimer: 'This is an estimate, not a religious ruling.',
}

const fieldsByVariant: Record<ZakatCalculatorVariant, FieldName[]> = {
  detailed: ['cash', 'metals', 'investments', 'liabilities'],
  quick: ['wealth'],
}

const emptyValues: Record<FieldName, string> = { cash: '', metals: '', investments: '', liabilities: '', wealth: '' }

export function ZakatCalculator({
  nisab,
  currency,
  rate = DEFAULT_ZAKAT_RATE,
  variant = 'detailed',
  locale = 'en-AE',
  labels: labelOverrides,
  onCalculate,
  onPay,
  className,
}: ZakatCalculatorProps) {
  const labels = { ...defaultLabels, ...labelOverrides }
  const fields = fieldsByVariant[variant]
  const titleId = useId()

  const [values, setValues] = useState(emptyValues)
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({})
  const [result, setResult] = useState<ZakatResult | null>(null)
  const inputs = useRef<Partial<Record<FieldName, HTMLInputElement | null>>>({})

  const money = (amount: number) => formatMoney(amount, currency, { locale })
  const hints: Partial<Record<FieldName, string>> = { liabilities: labels.liabilitiesHint, wealth: labels.wealthHint }

  function handleChange(field: FieldName, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    // A result must always match the inputs on screen, so editing clears it.
    setResult(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const amounts: Partial<Record<FieldName, number>> = {}
    const nextErrors: Partial<Record<FieldName, string>> = {}
    for (const field of fields) {
      const amount = parseMoney(values[field], currency)
      if (amount === null) nextErrors[field] = labels.invalidAmount
      else amounts[field] = amount
    }
    setErrors(nextErrors)

    const firstInvalid = fields.find((field) => nextErrors[field])
    if (firstInvalid) {
      setResult(null)
      // Send keyboard and screen reader users straight to the problem.
      inputs.current[firstInvalid]?.focus()
      return
    }

    const { cash = 0, metals = 0, investments = 0, liabilities = 0, wealth = 0 } = amounts
    const next = calculateZakat({ assets: cash + metals + investments + wealth, liabilities, nisab, rate })
    setResult(next)
    onCalculate?.(next)
  }

  function handleReset() {
    setValues(emptyValues)
    setErrors({})
    setResult(null)
    inputs.current[fields[0]]?.focus()
  }

  return (
    <section
      aria-labelledby={titleId}
      className={cx('rounded-card border border-default bg-surface p-5 sm:p-6', className)}
    >
      <h2 id={titleId} className="text-heading text-default">
        {labels.title}
      </h2>
      <p className="mt-1 text-body-sm text-muted">{labels.description}</p>

      <form noValidate onSubmit={handleSubmit} className="mt-5">
        <div className={cx('grid gap-4', variant === 'detailed' && 'sm:grid-cols-2')}>
          {fields.map((field) => (
            <InputField
              key={field}
              ref={(element) => {
                inputs.current[field] = element
              }}
              label={labels[field]}
              description={hints[field]}
              error={errors[field]}
              variant="filled"
              size={variant === 'quick' ? 'lg' : 'md'}
              startAdornment={currencySymbol(currency, locale)}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={values[field]}
              onChange={(event) => handleChange(field, event.target.value)}
            />
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="submit">{labels.calculate}</Button>
          <Button variant="ghost" onClick={handleReset}>
            {labels.reset}
          </Button>
        </div>
      </form>

      {/*
        role="status" announces the result when it appears, without moving focus.
        Not an <output>: that element only allows phrasing content, and the result holds paragraphs.
      */}
      {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role */}
      <div role="status">
        {result?.isDue && (
          // The deep green panel opts into the dark token set, so its focus ring and text keep their contrast.
          <div
            data-theme="dark"
            className="relative isolate mt-5 overflow-hidden rounded-control border border-on-brand-strong bg-brand-strong p-5 text-on-brand-strong"
          >
            <KhatamPattern className="-z-10 text-on-brand-strong-muted opacity-10" />
            <p className="text-label text-on-brand-strong-muted">{labels.dueTitle}</p>
            <p className="mt-1 text-display tabular-nums">
              <bdi>{money(result.zakatDue)}</bdi>
            </p>
            <p className="mt-1 text-body-sm text-on-brand-strong-muted">
              {labels.dueDetail({
                rate: new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 3 }).format(result.rate),
                wealth: money(result.zakatableWealth),
              })}
            </p>
            {onPay && (
              <Button className="mt-4" onClick={() => onPay(result)}>
                {labels.pay(money(result.zakatDue))}
              </Button>
            )}
          </div>
        )}

        {result && !result.isDue && (
          <div className="mt-5 rounded-control bg-subtle p-5">
            <p className="text-label text-default">{labels.notDueTitle}</p>
            <p className="mt-1 text-body-sm text-muted">
              {labels.notDueDetail({ wealth: money(result.zakatableWealth), nisab: money(result.nisab) })}
            </p>
          </div>
        )}
      </div>

      <p className="mt-4 text-body-sm text-muted">
        {labels.nisab(money(nisab))} {labels.disclaimer}
      </p>
    </section>
  )
}
