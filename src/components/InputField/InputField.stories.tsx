import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'

import { InputField } from './InputField'

const meta = {
  title: 'Components/InputField',
  component: InputField,
  args: {
    label: 'Full name',
    placeholder: 'Aisha Al Mansoori',
  },
  argTypes: {
    startAdornment: { control: 'text' },
    endAdornment: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InputField>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** `outline` is the default. `filled` is quieter, for dense forms inside cards. */
export const Variants: Story = {
  parameters: { controls: { exclude: ['variant', 'label'] } },
  render: (args) => (
    <div className="grid gap-5">
      <InputField {...args} variant="outline" label="Outline" />
      <InputField {...args} variant="filled" label="Filled" />
    </div>
  ),
}

export const Sizes: Story = {
  parameters: { controls: { exclude: ['size', 'label'] } },
  render: (args) => (
    <div className="grid gap-5">
      <InputField {...args} size="md" label="Medium, 44px" />
      <InputField {...args} size="lg" label="Large, 52px" />
    </div>
  ),
}

/** A text adornment such as a currency code is read out with the field. */
export const WithAdornment: Story = {
  args: {
    label: 'Amount',
    startAdornment: 'AED',
    placeholder: '0.00',
    inputMode: 'decimal',
    description: 'You can send up to AED 50,000 a day.',
  },
}

export const Required: Story = {
  args: { required: true, description: 'As it appears on your Emirates ID.' },
}

/**
 * Passing `error` marks the input invalid, links the message to it and
 * announces the message. An icon backs up the colour.
 */
export const Invalid: Story = {
  args: {
    label: 'IBAN',
    defaultValue: 'AE07 0331',
    error: 'Enter all 23 characters of the IBAN.',
    description: 'Starts with AE.',
  },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox', { name: 'IBAN' })

    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input).toHaveAccessibleDescription('Starts with AE. Enter all 23 characters of the IBAN.')
  },
}

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Aisha Al Mansoori' },
}

/** The label is the accessible name, and clicking it focuses the input. */
export const LabelFocusesInput: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByText('Full name'))
    await expect(canvas.getByRole('textbox', { name: 'Full name' })).toHaveFocus()
  },
}

export const DarkTheme: Story = {
  globals: { theme: 'dark' },
  parameters: { controls: { exclude: ['variant', 'label'] } },
  render: (args) => (
    <div className="grid gap-5">
      <InputField {...args} variant="outline" label="Outline" description="As it appears on your Emirates ID." />
      <InputField {...args} variant="filled" label="Filled" defaultValue="AE07 0331" error="Enter all 23 characters of the IBAN." />
    </div>
  ),
}

/** Arabic copy, right to left. The adornment moves to the right-hand start. Copy is illustrative. */
export const Arabic: Story = {
  globals: { direction: 'rtl' },
  parameters: { controls: { exclude: ['label', 'placeholder'] } },
  render: (args) => (
    <div className="grid gap-5">
      <InputField
        {...args}
        label="الاسم الكامل"
        placeholder="عائشة المنصوري"
        description="كما يظهر في بطاقة الهوية الإماراتية."
      />
      <InputField
        {...args}
        label="المبلغ"
        startAdornment="د.إ"
        placeholder="0.00"
        inputMode="decimal"
        error="أدخل مبلغًا صحيحًا."
      />
    </div>
  ),
}
