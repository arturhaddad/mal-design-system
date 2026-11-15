import { useLayoutEffect, useRef, type ChangeEvent, type FocusEvent, type KeyboardEvent } from 'react'

import { formatAmountInput, maskAmount, parseMoney } from './money'

/**
 * How every field that takes an amount behaves, so that money is typed the
 * same way across the system.
 *
 * - It takes digits and one decimal point, and drops anything else.
 * - It groups thousands while the person types and keeps the caret after the same digit.
 * - Backspace and Delete step over a separator instead of stopping at it.
 * - Leaving the field completes the decimals: "1,250" becomes "1,250.00".
 *
 * The component keeps the text in its own state. Call the returned function
 * once per field and spread the result on an `InputField`:
 *
 *     const amountInput = useAmountInput()
 *     <InputField value={text} {...amountInput(currency, setText)} />
 *
 * Amounts are typed the English way (`1,250.50`) in every locale.
 */
export function useAmountInput() {
  // Where the caret belongs once the masked text is in the field.
  const caret = useRef<{ input: HTMLInputElement; position: number } | null>(null)

  // React leaves the caret at the end of a value it rewrites. This puts it back before the browser paints.
  useLayoutEffect(() => {
    if (!caret.current) return
    const { input, position } = caret.current
    caret.current = null
    if (document.activeElement === input) input.setSelectionRange(position, position)
  })

  return function amountInput(currency: string, onChange: (text: string) => void) {
    return {
      inputMode: 'decimal' as const,
      autoComplete: 'off',
      placeholder: formatAmountInput(0, currency),

      onChange(event: ChangeEvent<HTMLInputElement>) {
        const input = event.currentTarget
        const masked = maskAmount(input.value, currency, input.selectionStart ?? input.value.length)
        caret.current = { input, position: masked.caret }
        onChange(masked.text)
      },

      // A separator is not something the person typed, so deleting never stops at one.
      onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        const input = event.currentTarget
        const { selectionStart: start, selectionEnd: end, value } = input
        if (start === null || start !== end) return

        if (event.key === 'Backspace' && value[start - 1] === ',') input.setSelectionRange(start - 1, start - 1)
        if (event.key === 'Delete' && value[start] === ',') input.setSelectionRange(start + 1, start + 1)
      },

      onBlur(event: FocusEvent<HTMLInputElement>) {
        const text = event.currentTarget.value
        if (text === '') return

        const amount = parseMoney(text, currency)
        const completed = amount === null ? text : formatAmountInput(amount, currency)
        if (completed !== text) onChange(completed)
      },
    }
  }
}
