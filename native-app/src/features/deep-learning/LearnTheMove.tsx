import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { DL_COLORS } from './theme';

// The one place in a stage that actually TEACHES the method, rather than just
// testing it: a short, dismissible, replayable walkthrough shown automatically
// the first time a player reaches a stage, built around a worked example with
// its own fixed numbers (never the quiz's randomized ones, so it never
// previews an answer). Everywhere else in a stage (the prompt, the Hint
// button, the post-answer explanation) assumes the player already knows the
// method and is just being reminded of it or told whether they applied it
// right — this is the only surface that actually shows HOW, one step at a
// time, before they're graded on it.

export interface LearnTheMoveStep {
  title: string;
  body: string;
  visual?: React.ReactNode;
}

export interface LearnTheMoveProps {
  visible: boolean;
  onDismiss: () => void;
  moduleTitle: string;
  steps: LearnTheMoveStep[];
  /** Swaps in a different worked example from the caller's pool. Omit to hide the refresh button entirely (e.g. a walkthrough with only one example). */
  onRefresh?: () => void;
  /** Bump this whenever `onRefresh` picks a new example — resets the step index back to 0 so the new example starts from its own step 1, not wherever the old one left off. */
  refreshKey?: number;
}

export function LearnTheMove({ visible, onDismiss, moduleTitle, steps, onRefresh, refreshKey }: LearnTheMoveProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (visible) setStepIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, refreshKey]);

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  if (!step) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.headerIcon}>🎓</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{moduleTitle}</Text>
            <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Close walkthrough" style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.dotsRefreshRow}>
            <View style={styles.dotsRow}>
              {steps.map((_, i) => (
                <View key={i} style={[styles.dot, i === stepIndex && styles.dotActive]} />
              ))}
            </View>
            {onRefresh && (
              <Pressable onPress={onRefresh} accessibilityRole="button" accessibilityLabel="Show a different example" style={styles.refreshPill}>
                <Text style={styles.refreshPillText}>🔄 New Example</Text>
              </Pressable>
            )}
          </View>

          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepBody}>{step.body}</Text>

          {step.visual && (
            <View key={stepIndex} style={styles.visualWrap}>
              {step.visual}
            </View>
          )}

          <View style={styles.navRow}>
            {stepIndex > 0 ? (
              <Pressable
                onPress={() => setStepIndex((i) => i - 1)}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Previous step"
              >
                <Text style={styles.backButtonText}>Back</Text>
              </Pressable>
            ) : (
              <View style={styles.backButtonSpacer} />
            )}
            <Pressable
              onPress={() => (isLast ? onDismiss() : setStepIndex((i) => i + 1))}
              style={styles.nextButton}
              accessibilityRole="button"
              accessibilityLabel={isLast ? "Let's go" : 'Next step'}
            >
              <Text style={styles.nextButtonText}>{isLast ? "Let's go ➔" : 'Next ➔'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** Reopens a dismissed LearnTheMove walkthrough — sits near the Hint button so a player who's lost can go straight back to "how do I even do this." */
export function LearnTheMoveButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.reopenButton} accessibilityRole="button" accessibilityLabel="Show me how this works">
      <Text style={styles.reopenButtonText}>🎓 Show Me How</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// MoneyBar — a stacked-segment growth visual shared by every worked example
// that involves a starting amount growing by some added chunk (interest,
// growth, etc.). Segments animate in bottom-up with a one-time stagger, never
// continuous motion, matching every other widget in this codebase.
// ---------------------------------------------------------------------------

export interface MoneyBarSegment {
  value: number;
  color: string;
  label: string;
}

export interface MoneyBarProps {
  segments: MoneyBarSegment[];
  maxValue: number;
  caption?: string;
  totalLabel?: string;
  barMaxHeight?: number;
}

function MoneyBarSegmentView({
  segment,
  index,
  maxValue,
  barMaxHeight,
}: {
  segment: MoneyBarSegment;
  index: number;
  maxValue: number;
  barMaxHeight: number;
}) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const translateY = useSharedValue(reducedMotion ? 0 : 14);

  useEffect(() => {
    if (reducedMotion) return;
    opacity.value = withDelay(index * 260, withTiming(1, { duration: 380 }));
    translateY.value = withDelay(index * 260, withTiming(0, { duration: 380 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const height = Math.max(20, (segment.value / maxValue) * barMaxHeight);

  return (
    <Animated.View style={[styles.barSegment, { height, backgroundColor: segment.color }, animStyle]}>
      <Text style={styles.barSegmentLabel} numberOfLines={1}>{segment.label}</Text>
    </Animated.View>
  );
}

/** A vertical stack of colored segments (e.g. principal + interest), each labeled with its own dollar amount, growing in bottom-up. */
export function MoneyBar({ segments, maxValue, caption, totalLabel, barMaxHeight = 140 }: MoneyBarProps) {
  return (
    <View style={styles.moneyBarCol}>
      {totalLabel && <Text style={styles.moneyBarTotal}>{totalLabel}</Text>}
      <View style={[styles.moneyBarTrack, { height: barMaxHeight }]}>
        <View style={styles.moneyBarStack}>
          {segments.map((segment, i) => (
            <MoneyBarSegmentView key={i} segment={segment} index={i} maxValue={maxValue} barMaxHeight={barMaxHeight} />
          ))}
        </View>
      </View>
      {caption && <Text style={styles.moneyBarCaption}>{caption}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 9, 18, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: DL_COLORS.surface,
    borderWidth: 2,
    borderColor: DL_COLORS.sky,
    borderRadius: 24,
    padding: 22,
    gap: 12,
    shadowColor: DL_COLORS.sky,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 20,
  },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: DL_COLORS.sky,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: DL_COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: DL_COLORS.textMuted,
  },
  dotsRefreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: DL_COLORS.border,
  },
  dotActive: {
    backgroundColor: DL_COLORS.sky,
    width: 18,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DL_COLORS.text,
    textAlign: 'center',
  },
  stepBody: {
    fontSize: 14,
    fontWeight: '600',
    color: DL_COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  visualWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButtonSpacer: {
    width: 1,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: DL_COLORS.textMuted,
  },
  nextButton: {
    backgroundColor: DL_COLORS.sky,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: DL_COLORS.bgDeep,
  },
  refreshPill: {
    borderWidth: 1.5,
    borderColor: DL_COLORS.amethyst,
    backgroundColor: DL_COLORS.amethystSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  refreshPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: DL_COLORS.amethyst,
  },
  reopenButton: {
    alignSelf: 'center',
    borderWidth: 1.5,
    borderColor: DL_COLORS.sky,
    backgroundColor: DL_COLORS.skySoft,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  reopenButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: DL_COLORS.sky,
  },

  // MoneyBar
  moneyBarCol: {
    alignItems: 'center',
    gap: 6,
  },
  moneyBarTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: DL_COLORS.lime,
  },
  moneyBarTrack: {
    width: 96,
    justifyContent: 'flex-end',
  },
  moneyBarStack: {
    flexDirection: 'column-reverse',
    width: '100%',
  },
  barSegment: {
    width: '100%',
    borderRadius: 8,
    marginTop: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barSegmentLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0B0F19',
  },
  moneyBarCaption: {
    fontSize: 11.5,
    fontWeight: '700',
    color: DL_COLORS.textMuted,
    textAlign: 'center',
  },
});

export default LearnTheMove;
