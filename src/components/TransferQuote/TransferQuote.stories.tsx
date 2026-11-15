import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'

import { TransferQuote, type TransferMethod } from './TransferQuote'

// Examples for the stories. The rate, the fees and the methods are not Mal's prices or products.
const methods: [TransferMethod, ...TransferMethod[]] = [
  { id: 'mal', label: 'Mal account', arrival: 'Instantly', fee: 0 },
  { id: 'bank', label: 'Bank account', arrival: 'In minutes', fee: 0 },
  { id: 'cash', label: 'Cash pickup', arrival: 'Within an hour', fee: 10_00 },
]

const meta = {
  title: 'Components/TransferQuote',
  component: TransferQuote,
  args: {
    sourceCurrency: 'AED',
    targetCurrency: 'PKR',
    // An example figure. In production the rate comes with the quote the product will honour.
    rate: 76.25,
    methods,
    onContinue: fn(),
  },
  argTypes: {
    methods: { control: false },
    defaultMethod: { control: 'radio', options: methods.map(({ id }) => id) },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TransferQuote>

export default meta
type Story = StoryObj<typeof meta>

/** Type either amount. The rate, the fees and the methods here are examples. */
export const Playground: Story = {
  args: { defaultSendAmount: 1_000_00 },
}

/**
 * One of each. `detailed` is the transfer flow: the choice of method and the
 * full breakdown. `compact` is for the top of a landing page: two amounts, one
 * line of terms and the action.
 */
export const Variants: Story = {
  args: { defaultSendAmount: 1_000_00 },
  parameters: { controls: { exclude: ['variant'] } },
  render: (args) => (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <p className="text-caption text-muted">detailed</p>
        <TransferQuote {...args} variant="detailed" />
      </div>
      <div className="grid gap-2">
        <p className="text-caption text-muted">compact</p>
        {/* Two regions on one page need two names. A real page has one quote. */}
        <TransferQuote {...args} variant="compact" labels={{ ...args.labels, title: 'Quick quote' }} />
      </div>
    </div>
  ),
}

/**
 * Either amount can be typed and the other follows. The field being typed in
 * is never rewritten. Leaving it announces the outcome to screen readers.
 */
export const EitherAmount: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const send = canvas.getByRole('textbox', { name: 'You send' })
    const receive = canvas.getByRole('textbox', { name: 'Recipient gets' })

    await userEvent.type(send, '1000')
    await expect(receive).toHaveValue('76,250.00')
    // What the person typed stays as they typed it.
    await expect(send).toHaveValue('1000')

    await userEvent.clear(receive)
    await userEvent.type(receive, '50000')
    // 50,000 / 76.25 is 655.737…, rounded up so that 50,000 arrives.
    await expect(send).toHaveValue('655.74')
    await expect(receive).toHaveValue('50000')

    await userEvent.tab()
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'You send AED 655.74. Recipient gets PKR 50,000.00. Fee: Free. Arrives: Instantly.',
    )
  },
}

/**
 * Methods are radio buttons, so arrow keys move between them. A method with a
 * fee takes it out of what is sent, and the breakdown shows the sum.
 */
export const ChoosingAMethod: Story = {
  args: { defaultSendAmount: 1_000_00 },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const receive = canvas.getByRole('textbox', { name: 'Recipient gets' })

    await expect(canvas.getByRole('radio', { name: /Mal account/ })).toBeChecked()
    await expect(receive).toHaveValue('76,250.00')

    await userEvent.click(canvas.getByRole('radio', { name: /Cash pickup/ }))
    // (1,000 − 10) × 76.25
    await expect(receive).toHaveValue('75,487.50')
    await expect(canvas.getByRole('status')).toHaveTextContent('Fee: AED 10.00. Arrives: Within an hour.')

    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }))
    await expect(args.onContinue).toHaveBeenCalledWith(
      expect.objectContaining({ sendAmount: 1_000_00, fee: 10_00, convertedAmount: 990_00, receiveAmount: 75_487_50 }),
      expect.objectContaining({ id: 'cash' }),
    )
  },
}

/**
 * Something that is not an amount shows its error once the person leaves the
 * field. The other amount empties instead of showing a stale figure.
 */
export const InvalidAmount: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const send = canvas.getByRole('textbox', { name: 'You send' })

    await userEvent.type(send, 'a thousand')
    await userEvent.tab()

    await expect(send).toHaveAttribute('aria-invalid', 'true')
    await expect(send).toHaveAccessibleDescription(/Enter an amount using digits/)
    await expect(canvas.getByRole('textbox', { name: 'Recipient gets' })).toHaveValue('')

    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }))
    await expect(send).toHaveFocus()
    await expect(args.onContinue).not.toHaveBeenCalled()
  },
}

/** An amount that the fee would swallow is refused, with the fee in the message. */
export const BelowTheFee: Story = {
  args: { defaultMethod: 'cash' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const send = canvas.getByRole('textbox', { name: 'You send' })

    await userEvent.type(send, '8')
    await userEvent.tab()

    await expect(send).toHaveAccessibleDescription(/Enter more than the AED\s10\.00 fee/)
  },
}

/** Continuing with nothing typed asks for an amount and moves focus to the field. */
export const NothingTyped: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }))

    const send = canvas.getByRole('textbox', { name: 'You send' })
    await expect(send).toHaveFocus()
    await expect(send).toHaveAccessibleDescription(/Enter an amount/)
    await expect(args.onContinue).not.toHaveBeenCalled()
  },
}

/**
 * Decimals follow each currency, from ISO 4217: the Kuwaiti dinar has three.
 * The component holds no rule of its own about them.
 */
export const ThreeDecimalCurrency: Story = {
  args: { targetCurrency: 'KWD', rate: 0.0837, defaultSendAmount: 1_000_00, variant: 'compact' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('textbox', { name: 'Recipient gets' })).toHaveValue('83.700')
  },
}

export const DarkTheme: Story = {
  args: { defaultSendAmount: 1_000_00, defaultMethod: 'cash' },
  globals: { theme: 'dark' },
}

/**
 * Arabic, right to left. Every string comes in through `labels`, and
 * Arabic-Indic digits are accepted as input. Copy is illustrative and would go
 * through localisation review.
 */
export const Arabic: Story = {
  globals: { direction: 'rtl' },
  args: {
    locale: 'ar-AE',
    methods: [
      { id: 'mal', label: 'حساب مال', arrival: 'فورًا', fee: 0 },
      { id: 'bank', label: 'حساب مصرفي', arrival: 'خلال دقائق', fee: 0 },
      { id: 'cash', label: 'استلام نقدي', arrival: 'خلال ساعة', fee: 10_00 },
    ],
    labels: {
      title: 'أرسل المال إلى الخارج',
      send: 'ترسل',
      receive: 'يستلم المستفيد',
      method: 'طريقة الاستلام',
      free: 'مجانًا',
      methodFee: (fee) => `رسوم ${fee}`,
      fee: 'الرسوم',
      converted: 'المبلغ الذي نحوّله',
      rate: 'سعر الصرف',
      arrival: 'موعد الوصول',
      continue: 'متابعة',
      invalidAmount: 'أدخل مبلغًا بالأرقام، مثل 1250.50.',
      emptyAmount: 'أدخل مبلغًا.',
      tooSmall: 'أدخل مبلغًا أكبر.',
      belowFee: (fee) => `أدخل مبلغًا أكبر من الرسوم (${fee}).`,
      summary: ({ send, receive, fee, arrival }) =>
        `ترسل ${send}. يستلم المستفيد ${receive}. الرسوم: ${fee}. موعد الوصول: ${arrival}.`,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Arabic-Indic digits are valid input.
    await userEvent.type(canvas.getByRole('textbox', { name: 'ترسل' }), '١٠٠٠')
    await expect(canvas.getByRole('textbox', { name: 'يستلم المستفيد' })).toHaveValue('76,250.00')
  },
}
