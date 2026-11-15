import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'

import { ArrowUpRightIcon, CheckIcon } from '../../icons'
import { Button } from './Button'

const meta = {
  title: 'Components/Button',
  component: Button,
  args: {
    children: 'Send money',
    onClick: fn(),
  },
  argTypes: {
    iconStart: { control: false },
    iconEnd: { control: false },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** Four levels of emphasis. A view has one `primary`; everything else steps down from it. */
export const Variants: Story = {
  parameters: { controls: { exclude: ['variant', 'children'] } },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
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
    </div>
  ),
}

/** `md` is the default and a 44px touch target. `sm` grows an invisible hit area on touch screens. */
export const Sizes: Story = {
  parameters: { controls: { exclude: ['size', 'children'] } },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
}

/** Icons sit at the start or the end of the label, so they swap sides in right-to-left text. */
export const WithIcons: Story = {
  parameters: { controls: { exclude: ['children'] } },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} iconEnd={<ArrowUpRightIcon />}>
        Send money
      </Button>
      <Button {...args} variant="secondary" iconStart={<CheckIcon />}>
        Mark as paid
      </Button>
    </div>
  ),
}

/**
 * A loading button keeps its width and its focus, and ignores clicks. Screen
 * readers hear the `loadingLabel`.
 */
export const Loading: Story = {
  args: { loading: true, loadingLabel: 'Sending' },
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole('button')

    await userEvent.click(button)
    await expect(args.onClick).not.toHaveBeenCalled()

    await expect(button).toHaveAttribute('aria-busy', 'true')
    button.focus()
    await expect(button).toHaveFocus()
  },
}

/** Disabled buttons use their own colour tokens instead of opacity, so they look the same on any surface. */
export const Disabled: Story = {
  parameters: { controls: { exclude: ['disabled', 'variant', 'children'] } },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} disabled variant="primary">
        Send money
      </Button>
      <Button {...args} disabled variant="secondary">
        Add recipient
      </Button>
    </div>
  ),
}

/** Enter and Space both activate the button, and focus shows a visible ring. */
export const KeyboardActivation: Story = {
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Send money' })

    await userEvent.tab()
    await expect(button).toHaveFocus()

    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    await expect(args.onClick).toHaveBeenCalledTimes(2)
  },
}

/** The same variants in the dark theme. No component has a `dark:` class: only the tokens change. */
export const DarkTheme: Story = {
  ...Variants,
  globals: { theme: 'dark' },
}

/** Arabic copy, right to left. The layout mirrors with no extra props. Copy is illustrative. */
export const Arabic: Story = {
  globals: { direction: 'rtl' },
  parameters: { controls: { exclude: ['children'] } },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} iconEnd={<ArrowUpRightIcon />}>
        إرسال الأموال
      </Button>
      <Button {...args} variant="secondary" iconStart={<CheckIcon />}>
        تم الدفع
      </Button>
      <Button {...args} variant="ghost">
        إلغاء
      </Button>
    </div>
  ),
}
