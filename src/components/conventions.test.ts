/**
 * The parts of "a component is done when" that a machine can check. They fail
 * the build, so a reviewer never has to ask for them.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const srcDir = fileURLToPath(new URL('../', import.meta.url))
const componentsDir = `${srcDir}components/`
const iconsDir = `${srcDir}icons/`
const publicApi = readFileSync(new URL('../index.ts', import.meta.url), 'utf8')

const componentNames = readdirSync(componentsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

/** Shipped source files: stories and tests are left out. */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.tsx?$/.test(file) && !/\.(stories|test)\.tsx?$/.test(file))
    .map((file) => dir + file)
}

/** Comments may talk about "right-to-left" or `dark:`. Only the code is checked. */
function code(file: string): string {
  return readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '$1')
}

const rules = [
  {
    name: 'uses no dark: class',
    fix: 'Themes are token overrides. If the dark theme looks wrong, a token is missing.',
    pattern: /\bdark:/,
  },
  {
    name: 'uses no raw colour',
    fix: 'Use the utility of a semantic token, such as bg-surface or text-muted.',
    pattern: /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab)\(/i,
  },
  {
    name: 'uses no left or right utility',
    fix: 'Use logical utilities (ps-, me-, start-, text-start), so the layout mirrors in Arabic.',
    pattern:
      /(?<![\w-])-?(?:ml|mr|pl|pr|left|right)-(?:\d|\[|px\b|auto\b|full\b)|\b(?:text|float|clear)-(?:left|right)\b|\b(?:rounded|border)-(?:l|r|tl|tr|bl|br)\b/,
  },
]

describe.each(rules)('shipped source $name', ({ pattern, fix }) => {
  const files = [...sourceFiles(componentsDir), ...sourceFiles(iconsDir)]

  it.each(files.map((file) => [file.slice(srcDir.length), file]))('%s', (_label, file) => {
    const offending = code(file)
      .split('\n')
      .filter((line) => pattern.test(line))
      .map((line) => line.trim())

    expect(offending, fix).toEqual([])
  })
})

describe.each(componentNames)('%s', (name) => {
  const folder = `${componentsDir}${name}/`

  it('has a component file, a stories file and an index', () => {
    for (const file of [`${name}.tsx`, `${name}.stories.tsx`, 'index.ts']) {
      expect(existsSync(folder + file), `${name}/${file} is missing`).toBe(true)
    }
  })

  it.each(['Playground', 'DarkTheme', 'Arabic'])('has the %s story', (story) => {
    const stories = readFileSync(`${folder}${name}.stories.tsx`, 'utf8')
    expect(stories).toMatch(new RegExp(`export const ${story}\\b`))
  })

  it('is exported from src/index.ts', () => {
    expect(publicApi).toContain(`'./components/${name}'`)
  })
})
