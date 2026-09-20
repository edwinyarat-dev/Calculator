import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { computeStats, parseNumberList } from '../utils/statistics';
import { theme } from '../theme';

// The median highlight is a deliberate, fixed "blue accent" — it's the taught
// concept (which number IS the median), not decorative chrome, so it stays
// constant even as the surrounding theme changes.
const BLUE_ACCENT = '#2F6FED';
const BLUE_ACCENT_SOFT = '#E3EAFD';

const COLORS = {
  surface: theme.color.surface,
  surfaceMuted: theme.color.surfaceMuted,
  border: theme.color.border,
  text: theme.color.text,
  textMuted: theme.color.textMuted,
  boxFill: '#EAF9F2',
  boxStroke: theme.color.mintDark,
};

const KEYPAD_ROWS: string[][] = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  [',', '0', '⌫'],
];

const CHART_WIDTH = 320;
const CHART_HEIGHT = 130;
const PAD_X = 28;
const BOX_TOP = 40;
const BOX_BOTTOM = 90;
const AXIS_Y = 65;

function formatNumber(value: number): string {
  const rounded = Math.round((value + Number.EPSILON) * 1000) / 1000;
  return String(rounded);
}

interface BoxPlotProps {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  medianHighlighted: boolean;
}

function BoxPlot({ min, q1, median, q3, max, medianHighlighted }: BoxPlotProps) {
  // Pad the domain so whisker caps never sit flush against the SVG edge,
  // and guard against a zero-width domain when every value is identical.
  const span = max - min || 1;
  const domainMin = min - span * 0.12;
  const domainMax = max + span * 0.12;
  const plotWidth = CHART_WIDTH - PAD_X * 2;

  const scaleX = (value: number) => PAD_X + ((value - domainMin) / (domainMax - domainMin)) * plotWidth;

  const xMin = scaleX(min);
  const xQ1 = scaleX(q1);
  const xMedian = scaleX(median);
  const xQ3 = scaleX(q3);
  const xMax = scaleX(max);

  return (
    <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" accessibilityLabel="Box and whisker plot">
      {/* whiskers */}
      <Line x1={xMin} y1={AXIS_Y} x2={xQ1} y2={AXIS_Y} stroke={COLORS.boxStroke} strokeWidth={2} />
      <Line x1={xQ3} y1={AXIS_Y} x2={xMax} y2={AXIS_Y} stroke={COLORS.boxStroke} strokeWidth={2} />
      {/* whisker end caps */}
      <Line x1={xMin} y1={BOX_TOP} x2={xMin} y2={BOX_BOTTOM} stroke={COLORS.boxStroke} strokeWidth={2} />
      <Line x1={xMax} y1={BOX_TOP} x2={xMax} y2={BOX_BOTTOM} stroke={COLORS.boxStroke} strokeWidth={2} />
      {/* box (Q1 to Q3) */}
      <Rect
        x={Math.min(xQ1, xQ3)}
        y={BOX_TOP}
        width={Math.max(Math.abs(xQ3 - xQ1), 1)}
        height={BOX_BOTTOM - BOX_TOP}
        fill={COLORS.boxFill}
        stroke={COLORS.boxStroke}
        strokeWidth={2}
      />
      {/* median glow, shown only while highlighted */}
      {medianHighlighted && (
        <Rect
          x={xMedian - 4}
          y={BOX_TOP - 4}
          width={8}
          height={BOX_BOTTOM - BOX_TOP + 8}
          fill={BLUE_ACCENT}
          opacity={0.18}
          rx={3}
        />
      )}
      {/* median line */}
      <Line
        x1={xMedian}
        y1={BOX_TOP}
        x2={xMedian}
        y2={BOX_BOTTOM}
        stroke={medianHighlighted ? BLUE_ACCENT : COLORS.boxStroke}
        strokeWidth={medianHighlighted ? 4 : 2}
      />
      {/* value labels */}
      <SvgText x={xMin} y={BOX_BOTTOM + 18} fontSize={11} fill={COLORS.textMuted} textAnchor="middle">
        {formatNumber(min)}
      </SvgText>
      <SvgText x={xMax} y={BOX_BOTTOM + 18} fontSize={11} fill={COLORS.textMuted} textAnchor="middle">
        {formatNumber(max)}
      </SvgText>
      <SvgText
        x={xMedian}
        y={BOX_TOP - 10}
        fontSize={11}
        fontWeight={medianHighlighted ? 'bold' : 'normal'}
        fill={medianHighlighted ? BLUE_ACCENT : COLORS.textMuted}
        textAnchor="middle"
      >
        {formatNumber(median)}
      </SvgText>
    </Svg>
  );
}

export default function DataStatisticsModule() {
  const [rawText, setRawText] = useState('4, 8, 15, 16, 23, 42');
  const [medianHighlighted, setMedianHighlighted] = useState(false);

  const values = useMemo(() => parseNumberList(rawText), [rawText]);
  const stats = useMemo(() => computeStats(values), [values]);
  const hasInvalidTokens = useMemo(
    () => rawText.split(',').some((token) => token.trim().length > 0 && !Number.isFinite(Number(token.trim()))),
    [rawText]
  );

  const medianIndexSet = useMemo(
    () => new Set(stats?.medianValueIndices ?? []),
    [stats]
  );

  function appendToken(token: string) {
    if (token === '⌫') {
      setRawText((prev) => prev.slice(0, -1));
      return;
    }
    setRawText((prev) => prev + token);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Type your numbers</Text>
      <TextInput
        style={styles.input}
        value={rawText}
        onChangeText={(text) => {
          setRawText(text);
          setMedianHighlighted(false);
        }}
        placeholder="e.g. 4, 8, 15, 16, 23, 42"
        placeholderTextColor={COLORS.textMuted}
        keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
        accessibilityLabel="Comma-separated number list"
      />
      {hasInvalidTokens && <Text style={styles.warning}>Some entries aren't valid numbers and were ignored.</Text>}

      <View style={styles.keypad}>
        {KEYPAD_ROWS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((token) => (
              <Pressable
                key={token}
                onPress={() => appendToken(token)}
                style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
                accessibilityRole="button"
                accessibilityLabel={token === '⌫' ? 'Backspace' : `Add ${token}`}
              >
                <Text style={styles.keyLabel}>{token}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Your numbers</Text>
      <View style={styles.chipRow}>
        {values.length === 0 && <Text style={styles.emptyHint}>Enter at least one number above.</Text>}
        {values.map((value, index) => {
          const isMedianChip = medianHighlighted && medianIndexSet.has(index);
          return (
            <View key={`${index}-${value}`} style={[styles.chip, isMedianChip && styles.chipHighlighted]}>
              <Text style={[styles.chipText, isMedianChip && styles.chipTextHighlighted]}>{formatNumber(value)}</Text>
            </View>
          );
        })}
      </View>

      {stats && (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Mean</Text>
              <Text style={styles.statValue}>{formatNumber(stats.mean)}</Text>
            </View>

            <Pressable
              onPress={() => setMedianHighlighted((prev) => !prev)}
              style={({ pressed }) => [styles.statItem, pressed && styles.statItemPressed]}
              accessibilityRole="button"
              accessibilityLabel="Highlight median"
              accessibilityState={{ selected: medianHighlighted }}
            >
              <Text style={[styles.statLabel, medianHighlighted && styles.statLabelHighlighted]}>Median 👆</Text>
              <Text style={[styles.statValue, medianHighlighted && styles.statValueHighlighted]}>
                {formatNumber(stats.median)}
              </Text>
            </Pressable>

            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Mode</Text>
              <Text style={styles.statValue}>
                {stats.modes.length > 0 ? stats.modes.map(formatNumber).join(', ') : 'None'}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Box-and-whisker plot</Text>
          <View style={styles.chartCard}>
            <BoxPlot
              min={stats.min}
              q1={stats.q1}
              median={stats.median}
              q3={stats.q3}
              max={stats.max}
              medianHighlighted={medianHighlighted}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
  },
  input: {
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: theme.font.bodyBold,
    color: COLORS.text,
  },
  warning: {
    fontSize: 12,
    fontFamily: theme.font.bodySemi,
    color: theme.color.coralDark,
    marginTop: 6,
  },
  keypad: {
    marginTop: 14,
    gap: 10,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 10,
  },
  key: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: theme.radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  keyPressed: {
    backgroundColor: COLORS.surfaceMuted,
    transform: [{ scale: 0.96 }],
  },
  keyLabel: {
    fontSize: 17,
    fontFamily: theme.font.bodyExtraBold,
    color: COLORS.text,
  },
  sectionLabel: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 13,
    fontFamily: theme.font.bodyExtraBold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: COLORS.textMuted,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptyHint: {
    fontSize: 13,
    fontFamily: theme.font.body,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  chip: {
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipHighlighted: {
    borderColor: BLUE_ACCENT,
    backgroundColor: BLUE_ACCENT_SOFT,
  },
  chipText: {
    fontSize: 14,
    fontFamily: theme.font.bodyBold,
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  chipTextHighlighted: {
    color: BLUE_ACCENT,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 20,
    backgroundColor: COLORS.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statItemPressed: {
    backgroundColor: BLUE_ACCENT_SOFT,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: theme.font.bodyExtraBold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: COLORS.textMuted,
  },
  statLabelHighlighted: {
    color: BLUE_ACCENT,
  },
  statValue: {
    marginTop: 4,
    fontSize: 19,
    fontFamily: theme.font.display,
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  statValueHighlighted: {
    color: BLUE_ACCENT,
  },
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
});
