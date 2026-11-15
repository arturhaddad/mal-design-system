import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import type { GestureResponderEvent } from 'react-native'

import { useTheme } from '../../native/useTheme'
import { useFocusRing } from '../../native/useFocusRing'
import type { Theme } from '../../tokens/native'
import type { ButtonContract, ButtonSize, ButtonVariant } from './Button.contract'

export interface ButtonProps extends ButtonContract {
  /** The label. React Native draws text only inside `Text`, so the button takes a string and wraps it. */
  children: string
  onPress?: (event: GestureResponderEvent) => void
}

interface Colours {
  background: string
  /** A touch screen has no hover. Pressing is the only feedback. */
  pressed: string
  border: string
  text: string
}

function variantColours({ background, border, text }: Theme): Record<ButtonVariant, Colours> {
  return {
    primary: { background: background.action, pressed: background.actionActive, border: 'transparent', text: text.onAction },
    secondary: { background: background.surface, pressed: background.subtle, border: border.control, text: text.default },
    ghost: { background: 'transparent', pressed: background.brandSubtle, border: 'transparent', text: text.brand },
    danger: { background: background.danger, pressed: background.dangerHover, border: 'transparent', text: text.onDanger },
  }
}

function sizeStyles({ control, spacing, textStyle, fontWeight }: Theme) {
  return {
    sm: { height: control.sm, paddingHorizontal: spacing * 3, text: textStyle.label },
    md: { height: control.md, paddingHorizontal: spacing * 5, text: textStyle.label },
    lg: { height: control.lg, paddingHorizontal: spacing * 6, text: { ...textStyle.body, fontWeight: fontWeight.medium } },
  } satisfies Record<ButtonSize, object>
}

/**
 * The React Native Button. Same variants, sizes and states as the web one,
 * drawn with `Pressable` and `Text` from the generated theme.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingLabel = 'Loading',
  fullWidth = false,
  disabled = false,
  onPress,
  children,
}: ButtonProps) {
  const theme = useTheme()
  const focusRing = useFocusRing()

  const colours: Colours = disabled
    ? { background: theme.background.disabled, pressed: theme.background.disabled, border: 'transparent', text: theme.text.disabled }
    : variantColours(theme)[variant]
  const { text: textStyle, ...box } = sizeStyles(theme)[size]

  return (
    <Pressable
      role="button"
      // The spinner replaces the label on screen, so the name says both.
      aria-label={loading ? `${loadingLabel} ${children}` : undefined}
      aria-busy={loading || undefined}
      aria-disabled={loading || disabled || undefined}
      disabled={disabled}
      // A loading button keeps its place in the focus order and ignores the press.
      onPress={loading ? undefined : onPress}
      // The small button is 32 high. The slop brings its touch target to 44.
      hitSlop={size === 'sm' ? 6 : undefined}
      {...focusRing.handlers}
      style={({ pressed }) => [
        styles.box,
        box,
        {
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          borderRadius: theme.radius.pill,
          borderColor: colours.border,
          backgroundColor: pressed && !loading ? colours.pressed : colours.background,
        },
        focusRing.style,
      ]}
    >
      {loading && (
        <View aria-hidden style={styles.spinner}>
          <ActivityIndicator size="small" color={colours.text} />
        </View>
      )}
      {/* The label keeps its space while loading, so the button never changes width. */}
      <Text
        numberOfLines={1}
        style={[textStyle, { color: colours.text, fontFamily: theme.fontFamily.latin, opacity: loading ? 0 : 1 }]}
      >
        {children}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  spinner: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
})
