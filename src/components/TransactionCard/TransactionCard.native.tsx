import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { GestureResponderEvent } from 'react-native'

import { useTheme } from '../../native/useTheme'
import { useFocusRing } from '../../native/useFocusRing'
import { formatTransaction } from './formatTransaction'
import { defaultTransactionCardLabels } from './TransactionCard.contract'
import type { TransactionCardContract } from './TransactionCard.contract'

export interface TransactionCardProps extends TransactionCardContract {
  /** Makes the whole card one button. */
  onPress?: (event: GestureResponderEvent) => void
}

/**
 * The React Native TransactionCard. Same props and the same words as the web
 * one: both format the amount and the date with `formatTransaction`.
 */
export function TransactionCard({
  title,
  description,
  amount,
  currency,
  direction,
  status = 'completed',
  date,
  variant = 'card',
  locale = 'en-AE',
  timeZone = 'Asia/Dubai',
  labels: labelOverrides,
  onPress,
}: TransactionCardProps) {
  const theme = useTheme()
  const focusRing = useFocusRing()
  const { background, border, text, textStyle, spacing, radius } = theme

  const labels = { ...defaultTransactionCardLabels, ...labelOverrides }
  const isIncoming = direction === 'incoming'
  const transaction = formatTransaction({ amount, currency, direction, date, locale, timeZone })

  const family = { fontFamily: theme.fontFamily.latin }
  const badge =
    status === 'pending'
      ? { label: labels.pending, background: background.warningSubtle, text: text.warning }
      : status === 'failed'
        ? { label: labels.failed, background: background.dangerSubtle, text: text.danger }
        : null

  const content = (
    <>
      {/* A text arrow. The web icons are SVG, which React Native only draws with react-native-svg. */}
      <View
        aria-hidden
        style={[
          styles.icon,
          { borderRadius: radius.chip, backgroundColor: isIncoming ? background.successSubtle : background.subtle },
        ]}
      >
        <Text style={[textStyle.heading, family, { color: isIncoming ? text.success : text.muted }]}>
          {isIncoming ? '↙︎' : '↗︎'}
        </Text>
      </View>

      <View style={styles.who}>
        {/* In a narrow card the badge wraps under the title, so the name is the last thing to truncate. */}
        <View style={[styles.titleLine, { columnGap: spacing * 2, rowGap: spacing / 2 }]}>
          <Text numberOfLines={1} style={[textStyle.label, family, styles.title, { color: text.default }]}>
            {title}
          </Text>
          {badge && (
            <View
              style={{
                borderRadius: radius.pill,
                paddingHorizontal: spacing * 2,
                paddingVertical: spacing / 2,
                backgroundColor: badge.background,
              }}
            >
              <Text style={[textStyle.caption, family, { color: badge.text }]}>{badge.label}</Text>
            </View>
          )}
        </View>
        {description && (
          <Text numberOfLines={1} style={[textStyle.bodySm, family, { color: text.muted }]}>
            {description}
          </Text>
        )}
      </View>

      <View style={styles.amount}>
        <Text
          // The sign is silent in a screen reader, so the amount is read with a word before it.
          aria-label={`${labels[direction]} ${transaction.amount}`}
          style={[
            textStyle.label,
            family,
            styles.figures,
            status === 'failed'
              ? { color: text.muted, textDecorationLine: 'line-through' }
              : { color: isIncoming ? text.success : text.default },
          ]}
        >
          {transaction.amount}
        </Text>
        {transaction.date && <Text style={[textStyle.bodySm, family, { color: text.muted }]}>{transaction.date}</Text>}
      </View>
    </>
  )

  const isCard = variant === 'card'
  const box = isCard
    ? { borderRadius: radius.card, borderWidth: 1, borderColor: border.default, backgroundColor: background.surface, padding: spacing * 4 }
    : { borderRadius: radius.control, paddingHorizontal: spacing * 2, paddingVertical: spacing * 3 }
  const layout = [styles.layout, { columnGap: spacing * 3 }, box]

  if (!onPress) return <View style={layout}>{content}</View>

  return (
    <Pressable
      role="button"
      onPress={onPress}
      {...focusRing.handlers}
      style={({ pressed }) => [
        layout,
        pressed && (isCard ? { borderColor: border.control } : { backgroundColor: background.subtle }),
        focusRing.style,
      ]}
    >
      {content}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  layout: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  // minWidth lets the name shrink and truncate before it pushes the amount out.
  who: { flex: 1, minWidth: 0 },
  titleLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  title: { flexShrink: 1 },
  amount: { alignItems: 'flex-end' },
  figures: { fontVariant: ['tabular-nums'] },
})
