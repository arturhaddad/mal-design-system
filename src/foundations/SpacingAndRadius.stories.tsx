import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Foundations/Spacing and radius',
  tags: ['!autodocs'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

// Written out in full: Tailwind only generates classes it can find as whole strings.
const steps = [
  { step: '1', width: 'w-1' },
  { step: '2', width: 'w-2' },
  { step: '3', width: 'w-3' },
  { step: '4', width: 'w-4' },
  { step: '5', width: 'w-5' },
  { step: '6', width: 'w-6' },
  { step: '8', width: 'w-8' },
  { step: '10', width: 'w-10' },
  { step: '12', width: 'w-12' },
  { step: '16', width: 'w-16' },
]

/**
 * One token, `--spacing`, sets a 4px grid. Every padding, margin, gap and size
 * utility is a multiple of it, so `p-4` is 16px.
 */
export const SpacingScale: Story = {
  render: () => (
    <ul className="grid max-w-md gap-2">
      {steps.map(({ step, width }) => (
        <li key={step} className="flex items-center gap-4">
          <code className="w-10 text-body-sm text-default">{step}</code>
          <span className="w-12 text-body-sm text-muted tabular-nums">{Number(step) * 4}px</span>
          <span aria-hidden="true" className={`${width} h-3 rounded-chip bg-action`} />
        </li>
      ))}
    </ul>
  ),
}

const heights = [
  { utility: 'h-control-sm', px: 32, use: 'Dense, pointer-first UI.' },
  { utility: 'h-control-md', px: 44, use: 'Default. A comfortable touch target.' },
  { utility: 'h-control-lg', px: 52, use: 'The main field or action of a screen.' },
]

/** Named heights shared by Button and InputField, so the two line up in a form row. */
export const ControlHeights: Story = {
  render: () => (
    <ul className="flex max-w-2xl flex-wrap items-end gap-4">
      {heights.map(({ utility, px, use }) => (
        <li key={utility} className="flex-1">
          <span
            aria-hidden="true"
            className={`${utility} block rounded-control border border-control bg-surface`}
          />
          <code className="mt-2 block text-body-sm text-default">{utility}</code>
          <span className="text-body-sm text-muted">
            {px}px. {use}
          </span>
        </li>
      ))}
    </ul>
  ),
}

const radii = [
  { utility: 'rounded-chip', value: '8px', use: 'Icon tiles and small inner shapes.' },
  { utility: 'rounded-control', value: '12px', use: 'Inputs and panels inside a card.' },
  { utility: 'rounded-card', value: '20px', use: 'Cards and other standalone surfaces.' },
  { utility: 'rounded-pill', value: 'full', use: 'Buttons and badges.' },
]

/** Radius is named by what it rounds. The scale steps up with the size of the element. */
export const Radius: Story = {
  render: () => (
    <ul className="grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
      {radii.map(({ utility, value, use }) => (
        <li key={utility}>
          <span aria-hidden="true" className={`${utility} block h-20 border border-control bg-surface`} />
          <code className="mt-2 block text-body-sm text-default">{utility}</code>
          <span className="text-body-sm text-muted">
            {value}. {use}
          </span>
        </li>
      ))}
    </ul>
  ),
}
