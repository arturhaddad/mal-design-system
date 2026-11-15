import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { expect, fn, userEvent, within } from 'storybook/test'

import { onAPhone } from '../../../.storybook/native'
import { useTheme } from '../../native/useTheme'
import { TransactionCard as WebTransactionCard } from './TransactionCard'
import { TransactionCard } from './TransactionCard.native'
import type { TransactionCardProps } from './TransactionCard.native'

const meta = {
  title: 'React Native/TransactionCard',
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
    date: { control: 'text' },
  },
  decorators: [onAPhone],
} satisfies Meta<typeof TransactionCard>

export default meta
type Story = StoryObj<typeof meta>

/** The surface and the dividers a list gives its rows, written as an app screen would. */
function Statement({ transaction }: { transaction: TransactionCardProps }) {
  const { background, border, radius, spacing } = useTheme()
  const divider = { borderTopWidth: 1, borderTopColor: border.default }

  return (
    <View
      role="list"
      style={{
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: border.default,
        backgroundColor: background.surface,
        paddingHorizontal: spacing * 2,
      }}
    >
      <View role="listitem">
        <TransactionCard {...transaction} variant="row" />
      </View>
      <View role="listitem" style={divider}>
        <TransactionCard
          {...transaction}
          variant="row"
          title="Salary"
          description="Noor Technologies"
          amount={18_500_00}
          direction="incoming"
          date="2026-11-10T05:00:00Z"
        />
      </View>
      <View role="listitem" style={divider}>
        <TransactionCard
          {...transaction}
          variant="row"
          title="DEWA"
          description="Utilities"
          amount={612_40}
          status="pending"
          date="2026-11-09T14:15:00Z"
        />
      </View>
      <View role="listitem" style={divider}>
        <TransactionCard
          {...transaction}
          variant="row"
          title="Ahmed Al Farsi"
          description="Transfer"
          amount={1_200_00}
          status="failed"
          date="2026-11-08T17:30:00Z"
        />
      </View>
    </View>
  )
}

export const Playground: Story = {}

/** One of each. `card` has its own border and surface. `row` has neither, and takes them from its list. */
export const Variants: Story = {
  parameters: { controls: { exclude: ['variant'] } },
  render: (args) => (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <p className="text-caption text-muted">card</p>
        <TransactionCard {...args} variant="card" />
      </div>
      <div className="grid gap-2">
        <p className="text-caption text-muted">row</p>
        <TransactionCard {...args} variant="row" />
      </div>
    </div>
  ),
}

/** Rows in a statement: incoming, pending and failed, in the same words as on the web. */
export const List: Story = {
  parameters: { controls: { exclude: ['variant'] } },
  render: (args) => <Statement transaction={args} />,
}

/** With `onPress` the whole card is one button. Its name is the whole transaction, ending with "Paid". */
export const Pressing: Story = {
  args: { onPress: fn() },
  parameters: {
    a11y: {
      config: {
        // The button is named by `aria-label`, and this rule checks that the name holds the words on
        // screen. axe reads those words with no space between the card's text elements
        // ("CarrefourGroceries"), so no name can match. The name does hold them, in order.
        rules: [{ id: 'label-content-name-mismatch', enabled: false }],
      },
    },
  },
  play: async ({ args, canvasElement }) => {
    const card = within(canvasElement).getByRole('button', { name: /Carrefour/ })

    await userEvent.click(card)
    await expect(args.onPress).toHaveBeenCalledOnce()

    await expect(card).toHaveAccessibleName(/Paid/)
  },
}

/** The web card above the React Native one. Both print the text `formatTransaction` returns. */
export const BesideTheWeb: Story = {
  name: 'Beside the web',
  parameters: { controls: { exclude: ['variant', 'onPress'] } },
  render: ({ onPress: _onPress, ...shared }) => (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <p className="text-caption text-muted">Web</p>
        <WebTransactionCard {...shared} variant="card" />
      </div>
      <div className="grid gap-2">
        <p className="text-caption text-muted">React Native</p>
        <TransactionCard {...shared} variant="card" />
      </div>
    </div>
  ),
}

/** The dark values of the same tokens. In an app the device setting picks the theme. */
export const DarkTheme: Story = {
  ...List,
  globals: { theme: 'dark' },
}
