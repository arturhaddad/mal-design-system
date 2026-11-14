import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { contrastPairs, contrastRatio } from '../tokens/contrast'
import { primitiveName, readTokens, resolveValue, utilityName, type Token } from './tokens'

const meta = {
  title: 'Foundations/Colour',
  tags: ['!autodocs'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const cell = 'border-b border-default px-3 py-2.5 text-start align-middle'
const heading = `${cell} text-caption text-muted`

/** A block of the colour itself. Never sample text, which would have to pass contrast on its own. */
function Swatch({ value }: { value: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        style={{ backgroundColor: value }}
        className="size-9 shrink-0 rounded-chip border border-default"
      />
      <span className="flex flex-col">
        <span className="text-body-sm text-default">{primitiveName(value)}</span>
        <span className="text-caption text-muted">{resolveValue(value)}</span>
      </span>
    </span>
  )
}

function TokenTable({ title, description, prefix }: { title: string; description: string; prefix: string }) {
  const [tokens] = useState(() => readTokens(prefix))

  return (
    <section>
      <h2 className="text-heading text-default">{title}</h2>
      <p className="mt-1 max-w-2xl text-body-sm text-muted">{description}</p>
      <div className="mt-4 overflow-x-auto rounded-card border border-default bg-surface">
        <table className="w-full min-w-xl border-collapse">
          <thead>
            <tr>
              <th scope="col" className={heading}>
                Utility
              </th>
              <th scope="col" className={heading}>
                Light
              </th>
              <th scope="col" className={heading}>
                Dark
              </th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr key={token.name}>
                <th scope="row" className={`${cell} font-regular`}>
                  <code className="text-body-sm text-default">{utilityName(token.name)}</code>
                </th>
                <td className={cell}>
                  <Swatch value={token.light} />
                </td>
                <td className={cell}>
                  <Swatch value={token.dark} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/**
 * The tokens components use. Each row is one semantic token, the utility it
 * generates, and the primitive it points at in each theme. The table is read
 * from the stylesheet at runtime.
 */
export const SemanticTokens: Story = {
  render: () => (
    <div className="grid max-w-4xl gap-10">
      <TokenTable
        title="Backgrounds"
        description="Generate bg-* utilities only. A background token cannot be used as a text colour."
        prefix="--background-color-"
      />
      <TokenTable
        title="Text"
        description="Generate text-* utilities only. The on-* tokens are the text colour for the fill of the same name."
        prefix="--text-color-"
      />
      <TokenTable
        title="Borders"
        description="border-default separates surfaces. border-control marks the edge of an input and holds 3:1."
        prefix="--border-color-"
      />
      <TokenTable
        title="Focus"
        description="One focus ring for every interactive element, drawn with outline so it survives forced-colours mode."
        prefix="--outline-color-"
      />
    </div>
  ),
}

function Ramp({ hue }: { hue: string }) {
  const [steps] = useState(() => readTokens(`--mal-${hue}-`))

  return (
    <div>
      <h3 className="text-label text-default capitalize">{hue}</h3>
      <ul className="mt-2 flex overflow-hidden rounded-control border border-default">
        {steps.map(({ name, light }) => {
          const onWhite = contrastRatio(light, '#ffffff')
          return (
            <li
              key={name}
              style={{ backgroundColor: light, color: onWhite >= 4.5 ? '#ffffff' : '#020b0e' }}
              className="flex min-w-0 flex-1 flex-col gap-0.5 px-2 py-3"
            >
              <span className="text-caption">{name.split('-').at(-1)}</span>
              <span className="truncate text-caption font-regular">{light}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * Raw values. Components never use these: Tailwind generates no utility for
 * them. They exist only to be pointed at by semantic tokens.
 */
export const Primitives: Story = {
  render: () => (
    <div className="grid max-w-4xl gap-6">
      <Ramp hue="emerald" />
      <Ramp hue="ink" />
      <Ramp hue="red" />
      <Ramp hue="amber" />
    </div>
  ),
}

function resolveIn(theme: 'light' | 'dark', tokens: Map<string, Token>, name: string): string {
  const token = tokens.get(name)
  return token ? resolveValue(token[theme]) : '#000000'
}

function Ratio({ foreground, background, minimum }: { foreground: string; background: string; minimum: number }) {
  const ratio = contrastRatio(foreground, background)
  const passes = ratio >= minimum
  const isText = minimum === 4.5

  return (
    <span className="flex items-center gap-2.5">
      {/* Text pairs are sampled as text. Boundary pairs are sampled as an edge, which is what they are. */}
      <span
        aria-hidden="true"
        style={isText ? { color: foreground, backgroundColor: background } : { borderColor: foreground, backgroundColor: background }}
        className={`grid size-9 shrink-0 place-items-center rounded-chip text-label ${isText ? '' : 'border-2'}`}
      >
        {isText && 'Aa'}
      </span>
      <span className="text-body-sm text-default tabular-nums">{ratio.toFixed(2)}:1</span>
      <span className={passes ? 'text-caption text-success' : 'text-caption text-danger'}>{passes ? 'Pass' : 'Fail'}</span>
    </span>
  )
}

/**
 * The contrast contract. Each foreground token is listed with the backgrounds
 * it may sit on and the WCAG 2.2 ratio the pair must hold: 4.5:1 for text, 3:1
 * for control boundaries and focus rings. The same list runs as a unit test.
 */
export const ContrastContract: Story = {
  render: function Render() {
    const [tokens] = useState(
      () =>
        new Map(
          ['--background-color-', '--text-color-', '--border-color-', '--outline-color-']
            .flatMap(readTokens)
            .map((token) => [token.name, token]),
        ),
    )

    return (
      <div className="max-w-4xl overflow-x-auto rounded-card border border-default bg-surface">
        <table className="w-full min-w-xl border-collapse">
          <thead>
            <tr>
              <th scope="col" className={heading}>
                Foreground on background
              </th>
              <th scope="col" className={heading}>
                Required
              </th>
              <th scope="col" className={heading}>
                Light
              </th>
              <th scope="col" className={heading}>
                Dark
              </th>
            </tr>
          </thead>
          <tbody>
            {contrastPairs.map(({ foreground, background, minimum }) => (
              <tr key={foreground + background}>
                <th scope="row" className={`${cell} font-regular`}>
                  <code className="text-body-sm text-default">
                    {utilityName(foreground)} on {utilityName(background)}
                  </code>
                </th>
                <td className={`${cell} text-body-sm text-muted tabular-nums`}>{minimum}:1</td>
                {(['light', 'dark'] as const).map((theme) => (
                  <td key={theme} className={cell}>
                    <Ratio
                      foreground={resolveIn(theme, tokens, foreground)}
                      background={resolveIn(theme, tokens, background)}
                      minimum={minimum}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  },
}
