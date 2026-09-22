import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { DL_COLORS } from './theme';

// Three purpose-built "case board" visuals for Data Detective's Learn-the-Move
// walkthrough — mean, median, and mode are three genuinely different
// operations on the same data, so each gets its own distinct visual instead
// of one chart reused three times with a different label.

const BAR_MAX_H = 100;

// ---------------------------------------------------------------------------
// Mean — "Evidence Levels": bars at their raw heights, then a dashed line
// drawn across at the mean's height — mean as "the level that balances them."
// ---------------------------------------------------------------------------

function EvidenceBar({ value, maxValue, index, isReading }: { value: number; maxValue: number; index: number; isReading: boolean }) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const translateY = useSharedValue(reducedMotion ? 0 : 10);

  useEffect(() => {
    if (reducedMotion) return;
    opacity.value = withDelay(index * 130, withTiming(1, { duration: 340 }));
    translateY.value = withDelay(index * 130, withTiming(0, { duration: 340 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));
  const height = Math.max(6, (value / maxValue) * BAR_MAX_H);

  return (
    <Animated.View style={[styles.evidenceBarCol, animStyle]}>
      <Text style={styles.evidenceBarLabel}>{value}</Text>
      <View style={[styles.evidenceBar, { height, backgroundColor: isReading ? DL_COLORS.sky : DL_COLORS.amethyst }]} />
    </Animated.View>
  );
}

export interface MeanLevelProps {
  values: number[];
  meanValue: number;
  totalLabel: string;
}

export function MeanLevel({ values, meanValue, totalLabel }: MeanLevelProps) {
  const reducedMotion = useReducedMotion();
  const lineOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const maxValue = Math.max(...values, meanValue);

  useEffect(() => {
    if (reducedMotion) return;
    lineOpacity.value = withDelay(values.length * 130 + 200, withTiming(1, { duration: 420 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lineStyle = useAnimatedStyle(() => ({ opacity: lineOpacity.value }));
  const lineBottom = (meanValue / maxValue) * BAR_MAX_H;

  return (
    <View style={styles.meanWrap}>
      <View style={styles.meanBarsRow}>
        {values.map((v, i) => (
          <EvidenceBar key={i} value={v} maxValue={maxValue} index={i} isReading={false} />
        ))}
        <Animated.View style={[styles.meanLine, { bottom: lineBottom }, lineStyle]} pointerEvents="none">
          <Text style={styles.meanLineLabel}>mean</Text>
        </Animated.View>
      </View>
      <Text style={styles.statTotal}>{totalLabel}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Median — "Sorted Lineup": values as reported, then the same values sorted
// with the middle one(s) highlighted — median as "sort first, THEN look."
// ---------------------------------------------------------------------------

function LineupChip({ value, highlighted, index }: { value: number; highlighted: boolean; index: number }) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) return;
    opacity.value = withDelay(index * 90, withTiming(1, { duration: 300 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.chip, highlighted && styles.chipHighlighted, animStyle]}>
      <Text style={[styles.chipText, highlighted && styles.chipTextHighlighted]}>{value}</Text>
    </Animated.View>
  );
}

export interface SortedLineupProps {
  reported: number[];
  sorted: number[];
  isMiddle: (index: number) => boolean;
  medianLabel: string;
}

export function SortedLineup({ reported, sorted, isMiddle, medianLabel }: SortedLineupProps) {
  return (
    <View style={styles.lineupWrap}>
      <Text style={styles.lineupCaption}>As reported</Text>
      <View style={styles.lineupRow}>
        {reported.map((v, i) => (
          <LineupChip key={`r-${i}`} value={v} highlighted={false} index={i} />
        ))}
      </View>
      <Text style={styles.lineupCaption}>Sorted lineup</Text>
      <View style={styles.lineupRow}>
        {sorted.map((v, i) => (
          <LineupChip key={`s-${i}`} value={v} highlighted={isMiddle(i)} index={reported.length + i} />
        ))}
      </View>
      <Text style={styles.statTotal}>{medianLabel}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Mode — "Tally Board": one bar per distinct value, length = how many times
// it showed up — mode as "whichever bar is longest," nothing to compute.
// ---------------------------------------------------------------------------

function TallyRow({ value, count, maxCount, isMode, index }: { value: number; count: number; maxCount: number; isMode: boolean; index: number }) {
  const reducedMotion = useReducedMotion();
  const width = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) return;
    width.value = withDelay(index * 160, withTiming(1, { duration: 380 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({ width: `${(count / maxCount) * 100 * width.value}%` }));

  return (
    <View style={styles.tallyRow}>
      <Text style={styles.tallyLabel}>{value}</Text>
      <View style={styles.tallyTrack}>
        <Animated.View style={[styles.tallyFill, isMode && styles.tallyFillMode, animStyle]} />
      </View>
      <Text style={styles.tallyCount}>×{count}</Text>
    </View>
  );
}

export interface TallyBoardProps {
  counts: { value: number; count: number }[];
  modeValue: number;
  modeLabel: string;
}

export function TallyBoard({ counts, modeValue, modeLabel }: TallyBoardProps) {
  const maxCount = Math.max(...counts.map((c) => c.count));
  return (
    <View style={styles.tallyWrap}>
      {counts.map((c, i) => (
        <TallyRow key={c.value} value={c.value} count={c.count} maxCount={maxCount} isMode={c.value === modeValue} index={i} />
      ))}
      <Text style={styles.statTotal}>{modeLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Mean
  meanWrap: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  meanBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    height: BAR_MAX_H + 24,
    width: '100%',
  },
  evidenceBarCol: {
    alignItems: 'center',
    gap: 4,
    width: 26,
  },
  evidenceBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: DL_COLORS.textMuted,
  },
  evidenceBar: {
    width: 18,
    borderRadius: 4,
  },
  meanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: DL_COLORS.lime,
    alignItems: 'flex-end',
  },
  meanLineLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: DL_COLORS.lime,
    textTransform: 'uppercase',
    marginTop: -14,
  },

  // Median
  lineupWrap: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  lineupCaption: {
    fontSize: 10.5,
    fontWeight: '800',
    color: DL_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  lineupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: DL_COLORS.border,
    backgroundColor: DL_COLORS.surfaceMuted,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  chipHighlighted: {
    borderColor: DL_COLORS.lime,
    backgroundColor: DL_COLORS.limeSoft,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: DL_COLORS.textMuted,
  },
  chipTextHighlighted: {
    color: DL_COLORS.lime,
    fontWeight: '800',
  },

  // Mode
  tallyWrap: {
    width: '100%',
    gap: 8,
  },
  tallyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tallyLabel: {
    width: 24,
    fontSize: 12,
    fontWeight: '700',
    color: DL_COLORS.textMuted,
    textAlign: 'right',
  },
  tallyTrack: {
    flex: 1,
    height: 16,
    borderRadius: 8,
    backgroundColor: DL_COLORS.surfaceMuted,
    overflow: 'hidden',
  },
  tallyFill: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: DL_COLORS.amethyst,
  },
  tallyFillMode: {
    backgroundColor: DL_COLORS.lime,
  },
  tallyCount: {
    width: 30,
    fontSize: 11.5,
    fontWeight: '700',
    color: DL_COLORS.textMuted,
  },

  statTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: DL_COLORS.text,
    textAlign: 'center',
    marginTop: 4,
  },
});
