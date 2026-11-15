/**
 * What a Button is on every platform: its variants, its sizes and its states.
 *
 * The web component and the React Native component both extend this type, so
 * the two cannot drift apart. Each adds what only its platform has, such as
 * `onClick` on the web and `onPress` in the app.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonContract {
  /**
   * Visual weight of the action.
   * - `primary`: the one main action of a view.
   * - `secondary`: an alternative next to a primary.
   * - `ghost`: low-emphasis actions such as "Cancel" or "Reset".
   * - `danger`: actions that destroy or cannot be undone.
   */
  variant?: ButtonVariant
  /** `md` is 44px tall, a comfortable touch target. `sm` is for dense, pointer-first UI. */
  size?: ButtonSize
  /**
   * Shows a spinner and ignores activation. Unlike `disabled`, the button stays
   * focusable, so keyboard and screen reader users are not thrown off it mid-task.
   */
  loading?: boolean
  /** Announced to assistive technology while `loading`. Pass a translated string. */
  loadingLabel?: string
  /** Stretches the button to the width of its container. */
  fullWidth?: boolean
  /** The action is not available. The button leaves the focus order and takes the disabled colours. */
  disabled?: boolean
}
