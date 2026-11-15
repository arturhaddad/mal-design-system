import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'

import { Button } from '../Button'
import { ZakatCalculator } from './ZakatCalculator'

const meta = {
  title: 'Components/ZakatCalculator',
  component: ZakatCalculator,
  args: {
    // An example figure. In production the nisab comes from the day's gold or silver price.
    nisab: 40_000_00,
    currency: 'AED',
    onCalculate: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ZakatCalculator>

export default meta
type Story = StoryObj<typeof meta>

/** Type amounts and press "Calculate zakat". The nisab here is an example value. */
export const Playground: Story = {}

/** `detailed` asks for assets and debts line by line. */
export const Detailed: Story = {
  args: { variant: 'detailed' },
}

/** `quick` is a single field, for people who already know their zakatable wealth. */
export const Quick: Story = {
  args: { variant: 'quick' },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
}

/**
 * `defaultValues` prefills the fields, for example from the customer's
 * balances, and the calculator opens with its result. `onPay` adds a payment
 * action to the result.
 */
export const Prefilled: Story = {
  args: {
    onPay: fn(),
    defaultValues: { cash: 95_000_00, metals: 20_000_50, investments: 15_000_00, liabilities: 10_000_00 },
  },
}

/**
 * Typing amounts and submitting. The result is announced through
 * `role="status"` without moving focus.
 */
export const CalculatesOnSubmit: Story = {
  args: { onPay: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.type(canvas.getByRole('textbox', { name: 'Cash and bank balances' }), '95000')
    await userEvent.type(canvas.getByRole('textbox', { name: 'Gold and silver' }), '20,000.50')
    await userEvent.type(canvas.getByRole('textbox', { name: 'Investments and shares' }), '15000')
    await userEvent.type(canvas.getByRole('textbox', { name: 'Debts due now' }), '10000')
    await userEvent.click(canvas.getByRole('button', { name: 'Calculate zakat' }))

    // 2.5% of (95,000 + 20,000.50 + 15,000 - 10,000)
    await expect(canvas.getByRole('status')).toHaveTextContent('AED 3,000.01')
    await expect(args.onCalculate).toHaveBeenCalledWith(
      expect.objectContaining({ zakatableWealth: 120_000_50, zakatDue: 3_000_01, isDue: true }),
    )

    await userEvent.click(canvas.getByRole('button', { name: /^Pay AED/ }))
    await expect(args.onPay).toHaveBeenCalledOnce()
  },
}

/**
 * The nisab is a prop, so the product chooses the standard and the price
 * behind it. Two buttons here switch between example silver and gold
 * thresholds, and the result follows without a new calculation.
 */
export const NisabStandard: Story = {
  parameters: { controls: { exclude: ['nisab'] } },
  args: { defaultValues: { cash: 30_000_00 } },
  render: function Render(args) {
    const [standard, setStandard] = useState<'silver' | 'gold'>('silver')

    return (
      <div className="grid gap-4">
        <fieldset className="flex gap-2">
          <legend className="sr-only">Nisab standard</legend>
          {(['silver', 'gold'] as const).map((option) => (
            <Button
              key={option}
              size="sm"
              variant={standard === option ? 'primary' : 'secondary'}
              aria-pressed={standard === option}
              onClick={() => setStandard(option)}
            >
              {option === 'silver' ? 'Silver nisab' : 'Gold nisab'}
            </Button>
          ))}
        </fieldset>
        {/* Example figures, not today's prices. */}
        <ZakatCalculator {...args} nisab={standard === 'silver' ? 2_500_00 : 40_000_00} />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // 2.5% of 30,000 is due against the silver threshold.
    await expect(canvas.getByRole('status')).toHaveTextContent('AED 750.00')

    // Nothing is due against the higher gold threshold, and nobody pressed "Calculate" again.
    await userEvent.click(canvas.getByRole('button', { name: 'Gold nisab' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('No zakat due')
  },
}

export const DarkTheme: Story = {
  ...Prefilled,
  globals: { theme: 'dark' },
}

/** Wealth below the nisab owes nothing, and the result explains why. */
export const BelowNisab: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.type(canvas.getByRole('textbox', { name: 'Cash and bank balances' }), '12000')
    await userEvent.click(canvas.getByRole('button', { name: 'Calculate zakat' }))

    await expect(canvas.getByRole('status')).toHaveTextContent('No zakat due')
  },
}

/**
 * The amount fields behave like every amount field in the system: digits and
 * one decimal point, thousands grouped while the person types, decimals
 * completed when the field is left. Completing the decimals does not clear a
 * result, because the amount has not changed.
 */
export const Typing: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const cash = canvas.getByRole<HTMLInputElement>('textbox', { name: 'Cash and bank balances' })
    const metals = canvas.getByRole<HTMLInputElement>('textbox', { name: 'Gold and silver' })

    await userEvent.type(metals, 'AED 20000.5x')
    await expect(metals).toHaveValue('20,000.5')

    // Enter submits without leaving the field.
    await userEvent.type(cash, '95000{Enter}')
    await expect(canvas.getByRole('status')).toHaveTextContent('Zakat due')
    await expect(metals).toHaveValue('20,000.50')

    await userEvent.tab()
    await expect(cash).toHaveValue('95,000.00')
    await expect(canvas.getByRole('status')).toHaveTextContent('Zakat due')
  },
}

/**
 * Arabic, right to left. Every string comes in through `labels`, and
 * `locale="ar-AE"` formats the amounts. Arabic-Indic digits are accepted as
 * input. Copy is illustrative and would go through localisation review.
 */
export const Arabic: Story = {
  globals: { direction: 'rtl' },
  args: {
    locale: 'ar-AE',
    onPay: fn(),
    defaultValues: { cash: 95_000_00, investments: 15_000_00 },
    labels: {
      title: 'حاسبة الزكاة',
      description: 'احسب زكاة مالك الذي حال عليه الحول.',
      cash: 'النقد والأرصدة المصرفية',
      metals: 'الذهب والفضة',
      investments: 'الاستثمارات والأسهم',
      liabilities: 'الديون المستحقة عليك',
      liabilitiesHint: 'تُخصم من أصولك.',
      wealth: 'المال الخاضع للزكاة',
      wealthHint: 'أصولك بعد خصم الديون المستحقة.',
      calculate: 'احسب الزكاة',
      reset: 'إعادة تعيين',
      dueTitle: 'الزكاة المستحقة',
      dueDetail: ({ rate, wealth }) => `${rate} من ${wealth} من المال الخاضع للزكاة.`,
      notDueTitle: 'لا زكاة عليك',
      notDueDetail: ({ wealth, nisab }) => `مالك الخاضع للزكاة (${wealth}) أقل من النصاب (${nisab}).`,
      pay: (amount) => `ادفع ${amount}`,
      // No full stop: the dirham symbol (د.إ.) already ends with one.
      nisab: (amount) => `النصاب: ${amount}`,
      disclaimer: 'هذا تقدير وليس فتوى شرعية.',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Arabic-Indic digits and the Arabic decimal separator are valid input.
    await userEvent.type(canvas.getByRole('textbox', { name: 'الذهب والفضة' }), '١٠٠٠٠٫٥٠')
    await userEvent.click(canvas.getByRole('button', { name: 'احسب الزكاة' }))

    // 2.5% of (95,000 + 10,000.50 + 15,000)
    await expect(canvas.getByRole('status')).toHaveTextContent('3,000.01')
  },
}
