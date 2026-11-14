import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'

import { BagIcon } from '../../icons'
import { TransactionCard } from './TransactionCard'

const meta = {
  title: 'Components/TransactionCard',
  component: TransactionCard,
  args: {
    title: 'Carrefour',
    description: 'Groceries',
    amount: 42_50,
    currency: 'AED',
    direction: 'outgoing',
    date: '2026-11-12T10:42:00Z',
  },
  argTypes: {
    icon: { control: false },
    date: { control: 'text' },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TransactionCard>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** `card` stands on its own. `row` is borderless, for lists. */
export const Variants: Story = {
  render: (args) => (
    <div className="grid gap-6">
      <TransactionCard {...args} variant="card" />
      <div className="rounded-card border border-default bg-surface px-2">
        <TransactionCard {...args} variant="row" />
      </div>
    </div>
  ),
}

/**
 * Incoming money gets a plus sign, a green amount and its own icon. Screen
 * readers hear "Received" or "Paid" instead of the sign.
 */
export const Directions: Story = {
  render: (args) => (
    <div className="grid gap-3">
      <TransactionCard {...args} />
      <TransactionCard {...args} title="Salary" description="Noor Technologies" amount={18_500_00} direction="incoming" />
    </div>
  ),
}

/** A settled transaction shows no badge. Pending and failed ones say so in words, with an icon. */
export const Statuses: Story = {
  render: (args) => (
    <div className="grid gap-3">
      <TransactionCard {...args} status="completed" />
      <TransactionCard {...args} status="pending" />
      <TransactionCard {...args} status="failed" />
    </div>
  ),
}

/** Pass `icon` to replace the direction arrow, e.g. with the merchant's category. */
export const WithCategoryIcon: Story = {
  args: { icon: <BagIcon /> },
}

/** With `onClick` the whole card is one button; with `href`, one link. Both show a focus ring. */
export const Interactive: Story = {
  args: { onClick: fn() },
  play: async ({ args, canvasElement }) => {
    const card = within(canvasElement).getByRole('button', { name: /Carrefour/ })

    await userEvent.tab()
    await expect(card).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(args.onClick).toHaveBeenCalledOnce()

    // The silent minus sign is backed by a word for screen readers.
    await expect(card).toHaveAccessibleName(/Paid/)
  },
}

/** Rows inside a list. The list owns the surface and the dividers; rows stay borderless. */
export const List: Story = {
  render: (args) => (
    <ul className="divide-y divide-default rounded-card border border-default bg-surface px-2">
      <li>
        <TransactionCard {...args} variant="row" icon={<BagIcon />} />
      </li>
      <li>
        <TransactionCard
          {...args}
          variant="row"
          title="Salary"
          description="Noor Technologies"
          amount={18_500_00}
          direction="incoming"
          date="2026-11-10T05:00:00Z"
        />
      </li>
      <li>
        <TransactionCard
          {...args}
          variant="row"
          title="DEWA"
          description="Utilities"
          amount={612_40}
          status="pending"
          date="2026-11-09T14:15:00Z"
        />
      </li>
      <li>
        <TransactionCard
          {...args}
          variant="row"
          title="Ahmed Al Farsi"
          description="Transfer"
          amount={1_200_00}
          status="failed"
          date="2026-11-08T17:30:00Z"
        />
      </li>
    </ul>
  ),
}

export const DarkTheme: Story = {
  ...List,
  globals: { theme: 'dark' },
}

/**
 * Arabic, right to left, with `locale="ar-AE"`. `Intl` formats the amount and
 * the date; `<bdi>` keeps the sign next to the digits. Copy is illustrative.
 */
export const Arabic: Story = {
  globals: { direction: 'rtl' },
  args: {
    locale: 'ar-AE',
    labels: { incoming: 'مستلم', outgoing: 'مدفوع', pending: 'قيد المعالجة', failed: 'فشلت' },
  },
  render: (args) => (
    <div className="grid gap-3">
      <TransactionCard {...args} title="كارفور" description="بقالة" />
      <TransactionCard {...args} title="راتب" description="نور للتقنية" amount={18_500_00} direction="incoming" />
      <TransactionCard {...args} title="هيئة كهرباء ومياه دبي" description="فواتير" amount={612_40} status="pending" />
    </div>
  ),
}
