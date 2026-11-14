/**
 * Opens every page of the built Storybook and fails if one does not render.
 *
 * Story tests run against the dev pipeline. The production build minifies the
 * CSS and bundles the pages differently, so a page can pass there and still
 * break here.
 *
 *   node scripts/smoke-build.mjs                       serves ./storybook-static
 *   node scripts/smoke-build.mjs https://example.com   checks a deployed build
 */
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from 'playwright'

const buildDir = fileURLToPath(new URL('../storybook-static/', import.meta.url))

const contentTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}

/** A static file server for the build, on a free port. */
async function serveBuild() {
  const server = createServer(async (request, response) => {
    const { pathname } = new URL(request.url, 'http://localhost')
    const file = path.join(buildDir, pathname.endsWith('/') ? `${pathname}index.html` : pathname)
    try {
      if (!file.startsWith(buildDir)) throw new Error('Outside the build')
      const body = await readFile(file)
      response.writeHead(200, { 'content-type': contentTypes[path.extname(file)] ?? 'application/octet-stream' })
      response.end(body)
    } catch {
      response.writeHead(404).end()
    }
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() }
}

const deployed = process.argv[2]
const local = deployed ? null : await serveBuild()
const base = (deployed ?? local.url).replace(/\/$/, '')

const index = await fetch(`${base}/index.json`).then((response) => response.json())
const entries = Object.values(index.entries)

const browser = await chromium.launch()
const page = await browser.newPage()

let problems = []
page.on('pageerror', (error) => problems.push(error.message))
page.on('response', (response) => {
  if (response.status() >= 400) problems.push(`${response.status()} ${response.url()}`)
})

const failures = []

for (const { id, type, title, name } of entries) {
  problems = []
  const mode = type === 'docs' ? 'docs' : 'story'
  await page.goto(`${base}/iframe.html?id=${id}&viewMode=${mode}`)

  // Storybook marks the body once the page has rendered, failed, or turned out not to exist.
  await page
    .waitForFunction(
      () => ['sb-show-main', 'sb-show-errordisplay', 'sb-show-nopreview'].some((name) => document.body.classList.contains(name)),
      { timeout: 15_000 },
    )
    .catch(() => problems.push('Timed out before rendering'))
  await page.waitForLoadState('networkidle')

  const state = await page.evaluate((mount) => {
    const classes = document.body.classList
    if (classes.contains('sb-show-errordisplay')) return document.querySelector('#error-message')?.textContent ?? 'Render error'
    if (!classes.contains('sb-show-main')) return 'Nothing rendered'
    return document.querySelector(mount)?.childElementCount ? null : 'Rendered empty'
  }, mode === 'docs' ? '#storybook-docs' : '#storybook-root')

  if (state) problems.push(state.trim())
  if (problems.length > 0) failures.push({ page: `${title} / ${name}`, problems: [...new Set(problems)] })
}

await browser.close()
local?.close()

for (const { page: label, problems: found } of failures) {
  console.error(`✗ ${label}`)
  for (const problem of found) console.error(`    ${problem}`)
}

console.log(`${entries.length - failures.length} of ${entries.length} pages rendered at ${base}`)
process.exit(failures.length > 0 ? 1 : 0)
