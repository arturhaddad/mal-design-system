# Mal Design System

A starter design system for Mal's web products: a token layer, five accessible React components and a Storybook playground. Two of the components also have a React Native version.

- **Playground:** https://mal-design-system-weld.vercel.app
- **Stack:** React 19, TypeScript, Tailwind CSS v4, Storybook 10, Vitest

## Run it

```sh
nvm use                 # Node 24
pnpm install
pnpm dev                # Storybook on http://localhost:6006

pnpm test               # unit tests: token contrast, conventions, money maths, zakat rules
pnpm test:stories       # every story in Chromium, with axe accessibility checks
pnpm build && pnpm test:build   # every page of the production build renders
pnpm lint && pnpm typecheck

pnpm tokens:native      # after a token change: rebuild the React Native theme
```

`pnpm test:stories` needs a browser the first time: `pnpm exec playwright install chromium`.

## How it is organised

```
src/
  tokens/        primitives.css, semantic.css, the contrast contract with its test,
                 and native.ts, the same tokens generated for React Native
  components/    one folder per component: Name.tsx, Name.stories.tsx, index.ts,
                 and for two of them Name.contract.ts and Name.native.tsx
  native/        the React Native entry: theme provider, useTheme, the native exports
  foundations/   Storybook pages for the tokens, read from the CSS at runtime
  icons/         the few icons the components need
  lib/           cx (class names) and money (minor units, formatting, parsing)
  styles.css     the one stylesheet a product imports
  index.ts       the public API
scripts/         the smoke test for the built Storybook, and the React Native theme build
```

Tokens come in two tiers. **Primitives** (`--mal-emerald-400`) are raw values that generate no utility class. **Semantic tokens** (`--background-color-action`) point at primitives, have a light and a dark value, and generate the utilities components use (`bg-action`). Tailwind's default palette is switched off, so the semantic tokens are the only colours, text styles and radii available.

## Adding a component

1. **Check that it belongs.** A component enters the system when two products need it, or when it settles a rule nobody should decide twice, such as how a field shows an error. One-off layouts stay in the product.

2. **Create the folder.** `src/components/Tooltip/` with `Tooltip.tsx`, `Tooltip.stories.tsx` and `index.ts`. `Badge` is the smallest example to copy.

3. **Design the props before the markup.**
   - A component that wraps one native element extends its props (`ComponentProps<'button'>`) and spreads the rest onto it, so `aria-*`, `data-*` and `ref` work without being declared. A composite such as `TransactionCard` lists its props and takes `className` for layout.
   - A visual option is a string union named `variant`, `size` or `tone`. Never a boolean such as `isDanger`.
   - Positions are `start` and `end`, never `left` and `right`.
   - No built-in copy. Take strings as props, or as a `labels` object with English defaults.
   - Make the inaccessible state impossible where you can. `InputField` requires `label`.

4. **Style with semantic tokens only.** Use the utilities listed under Foundations in Storybook.
   - One utility per CSS property per state. Variants are lookup objects, as in `Button.tsx`, so two classes never compete.
   - Logical utilities: `ps-4`, `ms-2`, `text-start`.
   - No `dark:` classes. If the dark theme looks wrong, a token is missing. Add it (see below) instead of patching the component.

5. **Write the stories.** They are the documentation, the test suite and the review surface at once.
   - `Playground`, driven by controls.
   - One story per variant axis and per state worth seeing.
   - `DarkTheme`, with `globals: { theme: 'dark' }`, so contrast is checked in both themes.
   - `Arabic`, with `globals: { direction: 'rtl' }` and real right-to-left copy.
   - A `play` function for each behaviour: keyboard, focus, what is announced.

6. **Run the checks.** `pnpm test:stories` runs every story in a browser and fails on any axe violation. Then use it by hand: Tab through it, and flip the Theme and Direction switches in the Storybook toolbar.

7. **Export it** from the folder's `index.ts` and from `src/index.ts`, then open a pull request.

A component is done when:

- [ ] it has at least two meaningful variants, exposed as a typed prop
- [ ] it works with the keyboard alone and shows a focus ring
- [ ] it passes axe in the light and the dark theme
- [ ] it mirrors in right-to-left and has an Arabic story
- [ ] it uses no raw colour, no `dark:` class and no left/right utility
- [ ] every string it renders can be translated

Most of this list is enforced. `pnpm test` fails on a raw colour, a `dark:` class or a left/right utility, and on a component with no `DarkTheme` or `Arabic` story. `pnpm test:stories` fails on an axe violation. Review is left with the questions a machine cannot answer: is the API right, and does it belong here.

## Adding a token

1. If the value is new, add a primitive to `src/tokens/primitives.css`.
2. Add the semantic token to `src/tokens/semantic.css`: the light value inside `@theme static`, the dark value under `[data-theme='dark']`. A test fails if either is missing.
3. If it is a text, border or focus colour, list the backgrounds it may sit on in `src/tokens/contrast.ts`.
4. Run `pnpm tokens:native`, so the React Native theme gets the token too.
5. Run `pnpm test`. It checks every listed pair against WCAG 2.2 in both themes, and that the React Native theme still matches the CSS.

## React Native

The system reaches a React Native app in two steps: the tokens, and then the components.

### Tokens

React Native cannot read CSS variables, so `src/tokens/native.ts` carries the same tokens as a typed object with a `light` and a `dark` theme.

The CSS stays the source. `pnpm tokens:native` reads the two token files and writes `native.ts`, and `pnpm test` fails while the two disagree. Nobody edits `native.ts` by hand.

- **Names are kept, in camelCase.** `--background-color-action-hover` is `theme.background.actionHover`, `--radius-pill` is `theme.radius.pill`, and the text style `--text-label` is `theme.textStyle.label`.
- **Values are converted.** Colours are resolved to hex. Sizes are numbers in density-independent pixels, so `0.75rem` is `12`. Letter spacing is absolute, and font weights are strings.
- **The contrast contract holds there too.** The same pairs are checked on the generated values, in both themes.
- **A value the script cannot convert stops it.** A new unit, or a kind of token it has no rule for, is an error and not a silent gap.

Shadows and motion are left out, because they do not map one to one. Fonts are named, not bundled: the app registers Inter and IBM Plex Sans Arabic and picks one per language, since React Native takes one family where CSS takes a fallback list.

### Components

`Button` and `TransactionCard` have a React Native version, in `Name.native.tsx` next to the web file. An app imports them from `src/native`:

```tsx
import { View } from 'react-native'

import { Button, ThemeProvider, TransactionCard } from './src/native'

export function App() {
  return (
    <ThemeProvider theme="dark">
      <View>
        <TransactionCard title="Carrefour" amount={4250} currency="AED" direction="outgoing" date="2026-11-12T10:42:00Z" />
        <Button variant="secondary" size="lg" onPress={() => {}}>
          Send money
        </Button>
      </View>
    </ThemeProvider>
  )
}
```

- **One contract.** `Name.contract.ts` declares the variants and the shared props once, and both versions extend it. A variant added there fails the type check until both platforms draw it.
- **Two implementations.** The web version is HTML with Tailwind classes. The native version is `Pressable`, `View` and `Text`, styled from `useTheme()`. They share no styling code.
- **The same words.** `formatTransaction` formats the amount and the date for both.
- **The theme follows the device.** `ThemeProvider` fixes it, for an app with its own setting.

In Storybook they sit under **React Native** and run in the browser through react-native-web. That is one alias in `vite.config.ts`, and only the React Native pages load it.

They have not run on a phone or in a simulator, and this repository has no app. The browser shows their layout, colours and behaviour. It does not show a phone's fonts, keyboard, screen reader or right-to-left layout. The direction icon of the native `TransactionCard` is a text arrow, because the web icons are SVG and React Native needs a library to draw them.

To give another component a native version, add `Name.contract.ts`, `Name.native.tsx` and `Name.native.stories.tsx`, and export it from `src/native/index.ts`. Once the native file exists, `pnpm test` fails until the rest does.

## Why Tailwind CSS v4

- **The token file is the configuration.** v4 reads its theme from CSS variables. The same variables are there for anything on the web that is not React, such as a marketing page or a chart.
- **No runtime.** Styles are static CSS. Nothing is injected at render time, so styling never forces a component onto the client or adds script to the pages where load time matters most, such as onboarding.
- **Theming without code.** The dark theme, and a dark panel inside a light page, are variable overrides under `[data-theme]`. Components do not know about them.
- **The system can be closed.** With the default palette removed, `bg-emerald-500` produces no CSS, and a test rejects arbitrary values such as `bg-[#0b763a]`.
- **Direction is built in.** Logical utilities (`ps-4`, `text-start`) make right-to-left the default behaviour, not a second stylesheet.

The cost is long class strings, and variants kept by hand in lookup objects. CSS-in-JS would have given typed variants and colocated styles, at the price of a runtime or a build-time extractor, and a theme held in JavaScript, which plain CSS and static pages cannot read.

## Not here yet

This is a starter, scoped to two days. It is not published as a package: there is no library build, no `exports` map and no `'use client'` boundary on the interactive components. It has no visual regression tests, and its Arabic copy has not been through localisation review. The React Native side covers two of the five components and has only run in a browser: there is no app, no run on a device and no right-to-left story.
