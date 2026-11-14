import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'

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
 * Submitting something that is not an amount shows the error on the field,
 * links it to the input and moves focus there.
 */
export const InvalidAmount: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const metals = canvas.getByRole('textbox', { name: 'Gold and silver' })

    await userEvent.type(canvas.getByRole('textbox', { name: 'Cash and bank balances' }), '5000')
    await userEvent.type(metals, 'about ten grand')
    await userEvent.click(canvas.getByRole('button', { name: 'Calculate zakat' }))

    await expect(metals).toHaveFocus()
    await expect(metals).toHaveAttribute('aria-invalid', 'true')
    await expect(metals).toHaveAccessibleDescription(/Enter an amount using digits/)
    await expect(args.onCalculate).not.toHaveBeenCalled()
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
      invalidAmount: 'أدخل مبلغًا بالأرقام، مثل 1250.50.',
      dueTitle: 'الزكاة المستحقة',
      dueDetail: ({ rate, wealth }) => `${rate} من ${wealth} من المال الخاضع للزكاة.`,
      notDueTitle: 'لا زكاة عليك',
      notDueDetail: ({ wealth, nisab }) => `مالك الخاضع للزكاة (${wealth}) أقل من النصاب (${nisab}).`,
      pay: (amount) => `ادفع ${amount}`,
      nisab: (amount) => `النصاب: ${amount}.`,
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
