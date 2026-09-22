import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useBattlePulse } from './BattlePulseContext';
import { DL_COLORS } from './theme';

// Three alternatives to the plain digit keypad, one per realm still using it —
// each a genuinely different physical action, not the same grid re-skinned.
// All three share AnswerBlocks' contract (options/selected/correctValue/
// feedback/onSelect) and its accessibility-label convention
// (`Answer option ${value}`) so they drop straight into any stage that used
// to render a keypad, and the existing bot-testing pattern still works.

export type WidgetState = 'idle' | 'correct' | 'wrong' | 'reveal';

export interface AnswerWidgetProps {
  options: number[];
  selected: number | null;
  correctValue: number;
  feedback: 'idle' | 'correct' | 'wrong';
  disabled?: boolean;
  onSelect: (value: number) => void;
  prefix?: string;
}

function stateFor(opt: number, selected: number | null, correctValue: number, feedback: 'idle' | 'correct' | 'wrong'): WidgetState {
  if (feedback === 'idle') return 'idle';
  if (opt === selected) return feedback === 'correct' ? 'correct' : 'wrong';
  if (feedback === 'wrong' && opt === correctValue) return 'reveal';
  return 'idle';
}

// ---------------------------------------------------------------------------
// Money Grower — "Coin Catch": a scattered handful of floating coins, each
// with a one-time pop-in and a gentle idle shimmer (no continuous drift —
// a coin that never stops moving is also a coin a real finger, or a test,
// can never reliably land on).
// ---------------------------------------------------------------------------

function Coin({ value, prefix, state, disabled, delay, onPress }: {
  value: number;
  prefix?: string;
  state: WidgetState;
  disabled?: boolean;
  delay: number;
  onPress: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const pop = useSharedValue(reducedMotion ? 1 : 0);
  const shimmer = useSharedValue(0);
  const shake = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    pop.value = withDelay(delay, withTiming(1, { duration: 380 }));
    shimmer.value = withDelay(delay + 400, withSequence(withTiming(1, { duration: 900 }), withTiming(0, { duration: 900 })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state !== 'wrong' || reducedMotion) return;
    shake.value = withSequence(withTiming(-5, { duration: 45 }), withTiming(5, { duration: 45 }), withTiming(-3, { duration: 45 }), withTiming(0, { duration: 45 }));
  }, [state, shake, reducedMotion]);

  const coinStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }, { translateX: shake.value }],
  }));
  const shimmerStyle = useAnimatedStyle(() => ({ opacity: shimmer.value * 0.5 }));

  return (
    <Animated.View style={coinStyle}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        style={[styles.coin, state === 'correct' && styles.coinCorrect, state === 'wrong' && styles.coinWrong, state === 'reveal' && styles.coinReveal]}
        accessibilityRole="button"
        accessibilityLabel={`Answer option ${value}`}
      >
        <Animated.View style={[styles.coinShimmer, shimmerStyle]} pointerEvents="none" />
        <View style={styles.coinRidge} />
        <Text style={styles.coinText}>
          {prefix ?? ''}
          {value}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/** A handful of floating gold coins, each bearing a candidate amount — tap the one that's really worth the answer. */
export function CoinCatch({ options, selected, correctValue, feedback, disabled, onSelect, prefix }: AnswerWidgetProps) {
  const pulse = useBattlePulse();
  return (
    <View style={styles.coinField}>
      {options.map((opt, i) => (
        <Coin
          key={opt}
          value={opt}
          prefix={prefix}
          state={stateFor(opt, selected, correctValue, feedback)}
          disabled={disabled || feedback !== 'idle'}
          delay={i * 70}
          onPress={() => {
            pulse();
            onSelect(opt);
          }}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Shape Architect — "Piece Fit": tap the jigsaw piece that completes the
// blueprint. A correct tap snaps inward with a satisfying pop; a wrong one
// shakes and stays put.
// ---------------------------------------------------------------------------

function PuzzlePiece({ value, state, disabled, onPress }: {
  value: number;
  state: WidgetState;
  disabled?: boolean;
  onPress: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const snap = useSharedValue(0);
  const shake = useSharedValue(0);

  useEffect(() => {
    if (state === 'correct' && !reducedMotion) {
      snap.value = withSequence(withTiming(1, { duration: 160 }), withTiming(0.9, { duration: 120 }));
    }
  }, [state, snap, reducedMotion]);

  useEffect(() => {
    if (state !== 'wrong' || reducedMotion) return;
    shake.value = withSequence(withTiming(-6, { duration: 45 }), withTiming(6, { duration: 45 }), withTiming(-4, { duration: 45 }), withTiming(0, { duration: 45 }));
  }, [state, shake, reducedMotion]);

  const pieceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - snap.value * 0.12 }, { translateX: shake.value }],
  }));

  return (
    <Animated.View style={pieceStyle}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        style={[styles.piece, state === 'correct' && styles.pieceCorrect, state === 'wrong' && styles.pieceWrong, state === 'reveal' && styles.pieceReveal]}
        accessibilityRole="button"
        accessibilityLabel={`Answer option ${value}`}
      >
        <View style={[styles.pieceTab, styles.pieceTabTop]} />
        <View style={[styles.pieceTab, styles.pieceTabRight]} />
        <Text style={styles.pieceText}>{value}</Text>
      </Pressable>
    </Animated.View>
  );
}

/** Jigsaw pieces scattered around a blueprint — tap the one shaped like the right answer. */
export function PuzzlePieces({ options, selected, correctValue, feedback, disabled, onSelect }: AnswerWidgetProps) {
  const pulse = useBattlePulse();
  return (
    <View style={styles.pieceGrid}>
      {options.map((opt) => (
        <PuzzlePiece
          key={opt}
          value={opt}
          state={stateFor(opt, selected, correctValue, feedback)}
          disabled={disabled || feedback !== 'idle'}
          onPress={() => {
            pulse();
            onSelect(opt);
          }}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Data Detective — "Evidence Lineup": case-file cards. Pick the one that
// checks out; a wrong pick gets stamped RULED OUT, the right one CONFIRMED.
// ---------------------------------------------------------------------------

function EvidenceCard({ value, state, disabled, onPress }: {
  value: number;
  state: WidgetState;
  disabled?: boolean;
  onPress: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const stamp = useSharedValue(0);

  useEffect(() => {
    if (state === 'idle' || reducedMotion) return;
    stamp.value = withSequence(withTiming(1.3, { duration: 90 }), withTiming(1, { duration: 110 }));
  }, [state, stamp, reducedMotion]);

  const stampStyle = useAnimatedStyle(() => ({
    opacity: state === 'idle' ? 0 : 1,
    transform: [{ scale: stamp.value || 1 }, { rotate: '-8deg' }],
  }));

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.card, state === 'correct' && styles.cardCorrect, (state === 'wrong' || state === 'reveal') && styles.cardRuledOut]}
      accessibilityRole="button"
      accessibilityLabel={`Answer option ${value}`}
    >
      <Text style={styles.cardLabel}>CASE FILE</Text>
      <Text style={styles.cardValue}>{value}</Text>
      {state !== 'idle' && (
        <Animated.Text style={[styles.cardStamp, state === 'correct' ? styles.cardStampGood : styles.cardStampBad, stampStyle]}>
          {state === 'correct' ? 'CONFIRMED' : 'RULED OUT'}
        </Animated.Text>
      )}
    </Pressable>
  );
}

/** A lineup of case-file cards — tap the one whose number actually checks out. */
export function EvidenceLineup({ options, selected, correctValue, feedback, disabled, onSelect }: AnswerWidgetProps) {
  const pulse = useBattlePulse();
  return (
    <View style={styles.cardGrid}>
      {options.map((opt) => (
        <EvidenceCard
          key={opt}
          value={opt}
          state={stateFor(opt, selected, correctValue, feedback)}
          disabled={disabled || feedback !== 'idle'}
          onPress={() => {
            pulse();
            onSelect(opt);
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Coin Catch
  coinField: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    paddingVertical: 6,
  },
  coin: {
    width: 84,
    height: 84,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#B8860B',
    backgroundColor: '#F4C542',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    overflow: 'hidden',
  },
  coinShimmer: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    backgroundColor: '#FFFFFF',
  },
  coinRidge: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(184, 134, 11, 0.5)',
    borderStyle: 'dashed',
  },
  coinCorrect: { borderColor: DL_COLORS.lime, shadowColor: DL_COLORS.lime, shadowOpacity: 0.9, shadowOffset: { width: 0, height: 0 } },
  coinWrong: { borderColor: DL_COLORS.danger, shadowColor: DL_COLORS.danger, shadowOpacity: 0.9, shadowOffset: { width: 0, height: 0 } },
  coinReveal: { borderColor: DL_COLORS.lime, shadowColor: DL_COLORS.lime, shadowOpacity: 0.7, shadowOffset: { width: 0, height: 0 } },
  coinText: { fontSize: 15, fontWeight: '800', color: '#5A3D00' },

  // Piece Fit
  pieceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
    width: '100%',
    paddingVertical: 10,
  },
  piece: {
    width: 78,
    height: 78,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: DL_COLORS.amethyst,
    backgroundColor: DL_COLORS.amethystSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieceTab: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 2.5,
    borderColor: DL_COLORS.amethyst,
    backgroundColor: DL_COLORS.amethystSoft,
  },
  pieceTabTop: { top: -11, alignSelf: 'center' },
  pieceTabRight: { right: -11, top: '50%', marginTop: -9 },
  pieceCorrect: { borderColor: DL_COLORS.lime, backgroundColor: DL_COLORS.limeSoft },
  pieceWrong: { borderColor: DL_COLORS.danger, backgroundColor: DL_COLORS.dangerSoft },
  pieceReveal: { borderColor: DL_COLORS.lime, backgroundColor: DL_COLORS.limeSoft },
  pieceText: { fontSize: 17, fontWeight: '800', color: DL_COLORS.text },

  // Evidence Lineup
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    paddingVertical: 6,
  },
  card: {
    width: 100,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: DL_COLORS.border,
    backgroundColor: DL_COLORS.surfaceMuted,
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardCorrect: { borderColor: DL_COLORS.lime, backgroundColor: DL_COLORS.limeSoft },
  cardRuledOut: { borderColor: DL_COLORS.danger, backgroundColor: DL_COLORS.dangerSoft, opacity: 0.7 },
  cardLabel: { fontSize: 8.5, fontWeight: '800', color: DL_COLORS.textMuted, letterSpacing: 1, marginBottom: 4 },
  cardValue: { fontSize: 18, fontWeight: '800', color: DL_COLORS.text },
  cardStamp: {
    position: 'absolute',
    bottom: 8,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    borderWidth: 1.5,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  cardStampGood: { color: DL_COLORS.lime, borderColor: DL_COLORS.lime },
  cardStampBad: { color: DL_COLORS.danger, borderColor: DL_COLORS.danger },
});
