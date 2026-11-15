import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { expect, fn, userEvent, within } from 'storybook/test'

import { onAPhone } from '../../../.storybook/native'
import { Button as WebButton } from './Button'
import { Button } from './Button.native'

const meta = {
  title: 'React Native/Button',
  component: Button,
  args: {
    children: 'Send money',
    onPress: fn(),
  },
  decorators: [onAPhone],
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

const row = { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 } as const

export const Playground: Story = {}

/** The same four variants as on the web, from the same tokens. */
export const Variants: Story = {
  parameters: { controls: { exclude: ['variant', 'children'] } },
  render: (args) => (
    <View style={row}>
      <Button {...args} variant="primary">
        Send money
      </Button>
      <Button {...args} variant="secondary">
        Add recipient
      </Button>
      <Button {...args} variant="ghost">
        Cancel
      </Button>
      <Button {...args} variant="danger">
        Close account
      </Button>
    </View>
  ),
}

/** `sm` is 32 high, and `hitSlop` grows its touch target to 44. */
export const Sizes: Story = {
  parameters: { controls: { exclude: ['size', 'children'] } },
  render: (args) => (
    <View style={row}>
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </View>
  ),
}

/** A loading button keeps its width and ignores the press. A disabled one uses its own colour tokens. */
export const States: Story = {
  parameters: { controls: { exclude: ['loading', 'disabled', 'children'] } },
  render: (args) => (
    <View style={row}>
      <Button {...args} loading loadingLabel="Sending">
        Send money
      </Button>
      <Button {...args} disabled>
        Add recipient
      </Button>
    </View>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const loading = canvas.getByRole('button', { name: 'Sending Send money' })

    await userEvent.click(loading)
    await expect(args.onPress).not.toHaveBeenCalled()
    await expect(loading).toHaveAttribute('aria-busy', 'true')

    await expect(canvas.getByRole('button', { name: 'Add recipient' })).toBeDisabled()
  },
}

/** Pressing calls `onPress`. With a keyboard attached, Enter does too, and focus shows the ring. */
export const Pressing: Story = {
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Send money' })

    await userEvent.tab()
    await expect(button).toHaveFocus()
    await expect(getComputedStyle(button).outlineStyle).toBe('solid')

    await userEvent.keyboard('{Enter}')
    await expect(args.onPress).toHaveBeenCalledOnce()

    await userEvent.click(button)
    await expect(args.onPress).toHaveBeenCalledTimes(2)
  },
}

/** The web Button above the React Native one. Two implementations of one contract. */
export const BesideTheWeb: Story = {
  name: 'Beside the web',
  parameters: { controls: { exclude: ['variant', 'children', 'onPress'] } },
  render: ({ onPress: _onPress, children: _children, ...shared }) => (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <p className="text-caption text-muted">Web</p>
        <div className="flex flex-wrap items-center gap-3">
          <WebButton {...shared} variant="primary">
            Send money
          </WebButton>
          <WebButton {...shared} variant="secondary">
            Add recipient
          </WebButton>
          <WebButton {...shared} variant="ghost">
            Cancel
          </WebButton>
        </div>
      </div>
      <div className="grid gap-2">
        <p className="text-caption text-muted">React Native</p>
        <View style={row}>
          <Button {...shared} variant="primary">
            Send money
          </Button>
          <Button {...shared} variant="secondary">
            Add recipient
          </Button>
          <Button {...shared} variant="ghost">
            Cancel
          </Button>
        </View>
      </div>
    </div>
  ),
}

/** The dark values of the same tokens. In an app the device setting picks the theme. */
export const DarkTheme: Story = {
  ...Variants,
  globals: { theme: 'dark' },
}
