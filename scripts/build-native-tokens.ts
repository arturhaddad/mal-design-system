/**
 * Writes the React Native theme, src/tokens/native.ts, from the CSS tokens.
 *
 *   pnpm tokens:native
 */
import { writeFileSync } from 'node:fs'

import { readTokenSource } from '../src/tokens/source.ts'
import { renderNativeTokens } from './native-tokens.ts'

writeFileSync(new URL('../src/tokens/native.ts', import.meta.url), renderNativeTokens(readTokenSource()))
console.log('Wrote src/tokens/native.ts')
