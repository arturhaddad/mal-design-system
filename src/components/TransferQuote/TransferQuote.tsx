import { useId, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'

import { cx } from '../../lib/cx'
import { formatAmountInput, formatMoney, maskAmount, parseMoney } from '../../lib/money'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { InputField } from '../InputField'
import { quoteFromReceive, quoteFromSend, type TransferQuote as Quote } from './quoteTransfer'

export type TransferQuoteVariant = 'detailed' | 'compact'

/** One way the money can reach the recipient. */
export interface TransferMethod {
  id: string
  /** Where the money lands, e.g. "Bank account". */
  label: string
  /** When it lands, e.g. "In minutes". */
  arrival: string
  /** Flat fee in minor units of the source currency. Zero reads as "Free". */
  fee: number
}

/**
 * Every string the component renders. English is the default; pass
 * translations to localise it. Sentences with values in them are functions,
 * because word order around an amount differs between languages.
 */
export interface TransferQuoteLabels {
  title: string
  send: string
  receive: string
  method: string
  free: string
  methodFee: (fee: string) => string
  fee: string
  converted: string
  rate: string
  rateValue: (values: { source: string; target: string }) => string
  arrival: string
  continue: string
  emptyAmount: string
  tooSmall: string
  belowFee: (fee: string) => string
  /** Announced to screen readers when an amount or the method is settled. */
  summary: (values: { send: string; receive: string; fee: string; arrival: string }) => string
}

export interface TransferQuoteProps {
  /** ISO 4217 code of the currency the sender pays in. */
  sourceCurrency: string
  /** ISO 4217 code of the currency the recipient gets. */
  targetCurrency: string
  /**
   * How many units of the target currency one unit of the source buys. The
   * product supplies it, as the rate it will honour. The component fetches nothing.
   */
  rate: number
  /** The ways the money can arrive, each with its fee. The first one is selected unless `defaultMethod` says otherwise. */
  methods: [TransferMethod, ...TransferMethod[]]
  /**
   * - `detailed`: both amounts, the choice of method and the full breakdown, for the transfer flow.
   * - `compact`: both amounts and one line of terms, for the top of a landing page.
   */
  variant?: TransferQuoteVariant
  /** The amount the form opens with, in minor units of the source currency. */
  defaultSendAmount?: number
  /** The `id` of the method the form opens with. */
  defaultMethod?: string
  /** BCP 47 locale for amounts and the rate. */
  locale?: string
  labels?: Partial<TransferQuoteLabels>
  /** Shows the action, and is called with the quote on screen when it is valid. */
  onContinue?: (quote: Quote, method: TransferMethod) => void
  className?: string
}

const defaultLabels: TransferQuoteLabels = {
  title: 'Send money',
  send: 'You send',
  receive: 'Recipient gets',
  method: 'How it arrives',
  free: 'Free',
  methodFee: (fee) => `${fee} fee`,
  fee: 'Fee',
  converted: 'Amount we convert',
  rate: 'Exchange rate',
  rateValue: ({ source, target }) => `${source} = ${target}`,
  arrival: 'Arrives',
  continue: 'Continue',
  emptyAmount: 'Enter an amount.',
  tooSmall: 'Enter a larger amount.',
  belowFee: (fee) => `Enter more than the ${fee} fee.`,
  summary: ({ send, receive, fee, arrival }) =>
    `You send ${send}. Recipient gets ${receive}. Fee: ${fee}. Arrives: ${arrival}.`,
}

type Side = 'send' | 'receive'
type Problem = 'empty' | 'tooSmall' | 'belowFee'

/**
 * A quote for sending money across currencies: what the sender pays, what the
 * recipient gets, and the rate, fee and arrival time in between, all visible
 * before anyone commits. Either amount can be typed and the other follows.
 *
 * The amount fields take digits and one decimal point. They group thousands
 * while the person types, and complete the decimals when the field is left.
 * They are typed the English way (`1,250.50`) in every locale.
 *
 * The product supplies the rate and the methods. The maths lives in
 * `quoteFromSend` and `quoteFromReceive`, exported on their own for use
 * outside the component.
 */
export function TransferQuote({ variant = 'detailed', locale = 'en-AE', ...props }: TransferQuoteProps) {
  // What was typed means nothing for another pair of currencies, and the opening values only apply to a new form.
  const key = [variant, props.sourceCurrency, props.targetCurrency, props.defaultSendAmount, props.defaultMethod].join(':')
  return <QuoteForm key={key} variant={variant} locale={locale} {...props} />
}

type QuoteFormProps = TransferQuoteProps & Required<Pick<TransferQuoteProps, 'variant' | 'locale'>>

function QuoteForm({
  sourceCurrency,
  targetCurrency,
  rate,
  methods,
  variant,
  defaultSendAmount,
  defaultMethod,
  locale,
  labels: labelOverrides,
  onContinue,
  className,
}: QuoteFormProps) {
  const labels = { ...defaultLabels, ...labelOverrides }
  const titleId = useId()
  const methodName = useId()
  const inputs = useRef<Partial<Record<Side, HTMLInputElement | null>>>({})

  // The amount the person typed last, as the mask shows it. The other amount is always worked out from it.
  const [typed, setTyped] = useState<{ side: Side; text: string }>(() => ({
    side: 'send',
    text: defaultSendAmount ? formatAmountInput(defaultSendAmount, sourceCurrency) : '',
  }))
  const [methodId, setMethodId] = useState(defaultMethod)
  // An error waits until the person leaves the field. An empty field only counts once they try to continue.
  const [checked, setChecked] = useState<'no' | 'onBlur' | 'onContinue'>('no')
  const [announcement, setAnnouncement] = useState('')
  // Where the caret belongs once the masked text is in the field.
  const caret = useRef<{ side: Side; position: number } | null>(null)

  // React leaves the caret at the end of a value it rewrites. This puts it back before the browser paints.
  useLayoutEffect(() => {
    if (!caret.current) return
    const { side, position } = caret.current
    caret.current = null
    const input = inputs.current[side]
    if (input && document.activeElement === input) input.setSelectionRange(position, position)
  })

  const method = methods.find(({ id }) => id === methodId) ?? methods[0]
  const currencyOf: Record<Side, string> = { send: sourceCurrency, receive: targetCurrency }
  const money = (amount: number, currency: string) => formatMoney(amount, currency, { locale })
  const feeText = (fee: number) => (fee === 0 ? labels.free : money(fee, sourceCurrency))

  function quoteWith({ fee }: TransferMethod): { quote: Quote | null; problem: Problem | null } {
    // The mask only lets amounts through, so there is no "not a number" case to report.
    const amount = parseMoney(typed.text, currencyOf[typed.side]) ?? 0

    const corridor = { sourceCurrency, targetCurrency, rate, fee }
    const quote =
      typed.side === 'send'
        ? quoteFromSend({ ...corridor, sendAmount: amount })
        : quoteFromReceive({ ...corridor, receiveAmount: amount })

    if (amount === 0) return { quote: null, problem: 'empty' }
    if (quote.receiveAmount > 0 && quote.sendAmount > 0) return { quote, problem: null }
    return { quote: null, problem: fee > 0 && quote.sendAmount <= fee ? 'belowFee' : 'tooSmall' }
  }

  const { quote, problem } = quoteWith(method)

  const messages: Record<Problem, string> = {
    empty: labels.emptyAmount,
    tooSmall: labels.tooSmall,
    belowFee: labels.belowFee(money(method.fee, sourceCurrency)),
  }
  const isShown = problem !== null && checked !== 'no' && (problem !== 'empty' || checked === 'onContinue')
  const error = isShown ? messages[problem] : undefined

  const derived: Record<Side, string> = {
    send: quote ? formatAmountInput(quote.sendAmount, sourceCurrency) : '',
    receive: quote ? formatAmountInput(quote.receiveAmount, targetCurrency) : '',
  }
  // The field being typed in shows the masked text. The other one follows.
  const value = (side: Side) => (side === typed.side ? typed.text : derived[side])

  function announce(settled: Quote | null, { fee, arrival }: TransferMethod) {
    if (!settled) return
    setAnnouncement(
      labels.summary({
        send: money(settled.sendAmount, sourceCurrency),
        receive: money(settled.receiveAmount, targetCurrency),
        fee: feeText(fee),
        arrival,
      }),
    )
  }

  function handleChange(side: Side, input: HTMLInputElement) {
    const masked = maskAmount(input.value, currencyOf[side], input.selectionStart ?? input.value.length)
    caret.current = { side, position: masked.caret }
    setTyped({ side, text: masked.text })
    setChecked('no')
  }

  // A separator is not something the person typed, so deleting never stops at one. Backspace
  // right after a separator steps over it and deletes the digit before, and Delete does the same forwards.
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const { selectionStart: start, selectionEnd: end, value } = input
    if (start === null || start !== end) return

    if (event.key === 'Backspace' && value[start - 1] === ',') input.setSelectionRange(start - 1, start - 1)
    if (event.key === 'Delete' && value[start] === ',') input.setSelectionRange(start + 1, start + 1)
  }

  function handleBlur(side: Side) {
    // Leaving the field completes the decimals: "1,250" becomes "1,250.00".
    if (side === typed.side && typed.text !== '') {
      const amount = parseMoney(typed.text, currencyOf[side])
      if (amount !== null) setTyped({ side, text: formatAmountInput(amount, currencyOf[side]) })
    }
    setChecked((current) => (current === 'onContinue' ? current : 'onBlur'))
    announce(quote, method)
  }

  function handleMethod(next: TransferMethod) {
    setMethodId(next.id)
    announce(quoteWith(next).quote, next)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!quote) {
      setChecked('onContinue')
      // Send keyboard and screen reader users straight to the problem.
      inputs.current[typed.side]?.focus()
      return
    }
    onContinue?.(quote, method)
  }

  const rateText = labels.rateValue({
    source: `1 ${sourceCurrency}`,
    target: `${new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(rate)} ${targetCurrency}`,
  })

  const field = (side: Side) => (
    <InputField
      ref={(element) => {
        inputs.current[side] = element
      }}
      label={labels[side]}
      error={side === typed.side ? error : undefined}
      size="lg"
      startAdornment={currencyOf[side]}
      inputMode="decimal"
      autoComplete="off"
      placeholder={formatAmountInput(0, currencyOf[side])}
      value={value(side)}
      onChange={(event) => handleChange(side, event.target)}
      onKeyDown={handleKeyDown}
      onBlur={() => handleBlur(side)}
    />
  )

  return (
    <section
      aria-labelledby={titleId}
      className={cx('rounded-card border border-default bg-surface p-5 sm:p-6', className)}
    >
      <h2 id={titleId} className={variant === 'compact' ? 'sr-only' : 'text-heading text-default'}>
        {labels.title}
      </h2>

      <form noValidate onSubmit={handleSubmit} className={cx('grid gap-4', variant === 'detailed' && 'mt-5')}>
        {field('send')}
        {field('receive')}

        {variant === 'detailed' && methods.length > 1 && (
          <fieldset>
            <legend className="mb-1.5 text-label text-default">{labels.method}</legend>
            <div className="grid gap-2">
              {methods.map((option) => (
                <label
                  key={option.id}
                  className={cx(
                    'group flex cursor-pointer items-center gap-3 rounded-control border border-control px-3.5 py-3 transition-colors',
                    'hover:border-control-hover has-[:checked]:border-control-hover has-[:checked]:bg-subtle',
                    'outline-offset-2 outline-focus has-[:focus-visible]:outline-2',
                  )}
                >
                  <input
                    type="radio"
                    name={methodName}
                    value={option.id}
                    checked={option.id === method.id}
                    onChange={() => handleMethod(option)}
                    className="sr-only"
                  />
                  {/* The radio itself, redrawn: a ring, and a dot when selected. Colour is not the only sign. */}
                  <span
                    aria-hidden="true"
                    className="grid size-5 shrink-0 place-items-center rounded-pill border border-control text-default group-has-[:checked]:border-control-hover"
                  >
                    <span className="size-2.5 rounded-pill bg-current opacity-0 group-has-[:checked]:opacity-100" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-label text-default">{option.label}</span>
                    <span className="text-body-sm text-muted">{option.arrival}</span>
                  </span>
                  <span className="shrink-0 text-label text-default">
                    {option.fee === 0 ? labels.free : <bdi>{labels.methodFee(money(option.fee, sourceCurrency))}</bdi>}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {variant === 'detailed' && quote && (
          <dl className="grid gap-2 rounded-control bg-subtle p-4 text-body-sm">
            {[
              [labels.fee, feeText(quote.fee)],
              [labels.converted, money(quote.convertedAmount, sourceCurrency)],
              [labels.rate, rateText],
              [labels.arrival, method.arrival],
            ].map(([term, detail]) => (
              <div key={term} className="flex flex-wrap items-baseline justify-between gap-x-4">
                <dt className="text-muted">{term}</dt>
                <dd className="text-default tabular-nums">
                  <bdi>{detail}</bdi>
                </dd>
              </div>
            ))}
          </dl>
        )}

        {variant === 'compact' && (
          <p className="flex flex-wrap items-center gap-2 text-body-sm text-muted">
            <bdi>{rateText}</bdi>
            <Badge tone={method.fee === 0 ? 'success' : 'neutral'}>
              {method.fee === 0 ? labels.free : <bdi>{labels.methodFee(money(method.fee, sourceCurrency))}</bdi>}
            </Badge>
            <Badge>{method.arrival}</Badge>
          </p>
        )}

        {onContinue && (
          <Button type="submit" size="lg" fullWidth>
            {labels.continue}
          </Button>
        )}
      </form>

      {/* Tells a screen reader the outcome once an amount or the method is settled, and not on every keystroke. */}
      <output className="sr-only">{announcement}</output>
    </section>
  )
}
