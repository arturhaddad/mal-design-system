import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Skeleton',
  render: () => <p className="rounded-xl bg-emerald-900 p-6 font-medium text-white">Pipeline check</p>,
} satisfies Meta

export default meta

export const Default: StoryObj<typeof meta> = {}
