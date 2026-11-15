import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'

import { TransferQuote, type TransferMethod } from './TransferQuote'

// Examples for the stories, not Mal's prices or products. The two methods follow the ones
// mal.ai describes: to a Mal user, and to a linked PKR account.
const methods: [TransferMethod, ...TransferMethod[]] = [
  { id: 'mal', label: 'Mal recipient', arrival: 'Instantly', fee: 0 },
  { id: 'linked', label: 'Linked PKR account', arrival: 'In minutes', fee: 0 },
]

// A made-up third method, only for the stories that show what a fee does.
const methodsWithAFee: [TransferMethod, ...TransferMethod[]] = [
  ...methods,
  { id: 'fee', label: 'Example method with a fee', arrival: '1 to 3 business days', fee: 5_00 },
]

const meta = {
  title: 'Components/TransferQuote',
  component: TransferQuote,
  args: {
    sourceCurrency: 'USD',
    targetCurrency: 'PKR',
    // An example figure. In production the rate comes with the quote the product will honour.
    rate: 278.5,
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

/** Type either amount. The rate is an example, and the two methods follow the ones mal.ai describes. */
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
    await expect(receive).toHaveValue('278,500.00')
    // What the person typed stays as they typed it.
    await expect(send).toHaveValue('1000')

    await userEvent.clear(receive)
    await userEvent.type(receive, '50000')
    // 50,000 / 278.5 is 179.533…, rounded up so that 50,000 arrives.
    await expect(send).toHaveValue('179.54')
    await expect(receive).toHaveValue('50000')

    await userEvent.tab()
    await expect(canvas.getByRole('status')).toHaveTextContent(
      /You send \S{1,3}179\.54\. Recipient gets PKR 50,000\.00\. Fee: Free\. Arrives: Instantly\./,
    )
  },
}

/**
 * Methods are radio buttons, so arrow keys move between them. A method with a
 * fee takes it out of what is sent, and the breakdown shows the sum. The third
 * method here is made up to show that.
 */
export const ChoosingAMethod: Story = {
  args: { defaultSendAmount: 1_000_00, methods: methodsWithAFee },
  parameters: { controls: { exclude: ['defaultMethod'] } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const receive = canvas.getByRole('textbox', { name: 'Recipient gets' })

    await expect(canvas.getByRole('radio', { name: /Mal recipient/ })).toBeChecked()
    await expect(receive).toHaveValue('278,500.00')

    await userEvent.click(canvas.getByRole('radio', { name: /Example method with a fee/ }))
    // (1,000 − 5) × 278.5
    await expect(receive).toHaveValue('277,107.50')
    await expect(canvas.getByRole('status')).toHaveTextContent(/Fee: \S{1,3}5\.00\. Arrives: 1 to 3 business days\./)

    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }))
    await expect(args.onContinue).toHaveBeenCalledWith(
      expect.objectContaining({ sendAmount: 1_000_00, fee: 5_00, convertedAmount: 995_00, receiveAmount: 277_107_50 }),
      expect.objectContaining({ id: 'fee' }),
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

/** An amount that the fee would swallow is refused, with the fee in the message. The method is made up. */
export const BelowTheFee: Story = {
  args: { methods: methodsWithAFee, defaultMethod: 'fee' },
  parameters: { controls: { exclude: ['defaultMethod'] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const send = canvas.getByRole('textbox', { name: 'You send' })

    await userEvent.type(send, '3')
    await userEvent.tab()

    await expect(send).toHaveAccessibleDescription(/Enter more than the \S{1,3}5\.00 fee/)
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
  args: { targetCurrency: 'KWD', rate: 0.3075, defaultSendAmount: 1_000_00, variant: 'compact' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('textbox', { name: 'Recipient gets' })).toHaveValue('307.500')
  },
}

export const DarkTheme: Story = {
  args: { defaultSendAmount: 1_000_00, defaultMethod: 'linked' },
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
      { id: 'mal', label: 'مستخدم مال', arrival: 'فورًا', fee: 0 },
      { id: 'linked', label: 'حساب مرتبط بالروبية', arrival: 'خلال دقائق', fee: 0 },
    ],
    labels: {
      title: 'أرسل المال',
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
    await expect(canvas.getByRole('textbox', { name: 'يستلم المستفيد' })).toHaveValue('278,500.00')
  },
}
