import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Foundations/Typography',
  tags: ['!autodocs'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

// Written out in full: Tailwind only generates classes it can find as whole strings.
const styles = [
  { utility: 'text-display', use: 'The one figure a screen is about, such as a balance.' },
  { utility: 'text-title', use: 'Page titles.' },
  { utility: 'text-heading', use: 'Section and card headings.' },
  { utility: 'text-body-lg', use: 'Lead paragraphs and large inputs.' },
  { utility: 'text-body', use: 'Default reading size. Also the input size, so iOS never zooms on focus.' },
  { utility: 'text-body-sm', use: 'Secondary text, hints and errors.' },
  { utility: 'text-label', use: 'Buttons, field labels and list titles.' },
  { utility: 'text-caption', use: 'Badges and table headings.' },
]

/**
 * Text styles, not font sizes. Each utility sets size, line height, weight and
 * tracking together. Inter carries Latin text and IBM Plex Sans Arabic carries
 * Arabic, where tracking is reset because the script is joined.
 */
export const TextStyles: Story = {
  render: () => (
    <dl className="grid max-w-4xl gap-6">
      {styles.map(({ utility, use }) => (
        <div key={utility} className="grid gap-1 border-b border-default pb-6 sm:grid-cols-[14rem_1fr] sm:gap-6">
          <dt>
            <code className="text-body-sm text-default">{utility}</code>
            <p className="mt-1 text-body-sm text-muted">{use}</p>
          </dt>
          <dd className="min-w-0">
            <p className={`${utility} text-default`}>Send AED 1,250.00 to Aisha</p>
            <p className={`${utility} text-default`} lang="ar" dir="rtl">
              الخدمات المصرفية الرقمية
            </p>
          </dd>
        </div>
      ))}
    </dl>
  ),
}

/** Amounts use tabular figures, so digits line up in lists and do not jump as they change. */
export const TabularFigures: Story = {
  render: () => (
    <div className="grid max-w-xs gap-1 text-body text-default">
      {['AED 1,111.11', 'AED 9,090.90', 'AED 4,747.47'].map((amount) => (
        <div key={amount} className="flex justify-between border-b border-default py-2">
          <span className="text-muted">tabular-nums</span>
          <span className="tabular-nums">{amount}</span>
        </div>
      ))}
    </div>
  ),
}
