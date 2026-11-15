import type { Meta, StoryObj } from '@storybook/react-vite'

import { ClockIcon, KhatamIcon } from '../../icons'
import { Badge } from './Badge'

const meta = {
  title: 'Components/Badge',
  component: Badge,
  args: { children: 'Pending' },
  argTypes: { icon: { control: false } },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** Five tones. The text always carries the meaning, so colour is never the only signal. */
export const Tones: Story = {
  // Every badge here is fixed, so the story has no controls. Playground is the one to edit.
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="neutral">Scheduled</Badge>
      <Badge tone="brand">New</Badge>
      <Badge tone="success">Completed</Badge>
      <Badge tone="warning" icon={<ClockIcon size={14} />}>
        Pending
      </Badge>
      <Badge tone="danger">Failed</Badge>
    </div>
  ),
}

export const DarkTheme: Story = {
  ...Tones,
  globals: { theme: 'dark' },
}

/** Arabic copy, right to left. The icon stays at the start of the text. Copy is illustrative. */
export const Arabic: Story = {
  globals: { direction: 'rtl' },
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="brand" icon={<KhatamIcon size={14} />}>
        متوافق مع الشريعة
      </Badge>
      <Badge tone="warning" icon={<ClockIcon size={14} />}>
        قيد المعالجة
      </Badge>
      <Badge tone="danger">فشلت</Badge>
    </div>
  ),
}

/** A Sharia-compliance indicator is a badge with the khatam icon, not a separate component. */
export const ShariaCompliant: Story = {
  args: {
    tone: 'brand',
    icon: <KhatamIcon size={14} />,
    children: 'Sharia-compliant',
  },
}
