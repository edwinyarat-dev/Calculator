import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

const COLORS = {
  background: '#FFFFFF',
  surface: '#F4F6FA',
  border: '#DCE1EA',
  text: '#1B1E27',
  textMuted: '#6B7280',
  axis: '#9AA1B2',
  grid: '#E7EAF1',
  curve: '#2F6FED',
  pointA: '#1B1E27',
  secant: '#F5871F',
  pointB: '#F5871F',
};

const CHART_W = 320;
const CHART_H = 260;
const PAD = 32;
const PLOT_W = CHART_W - PAD * 2;
const PLOT_H = CHART_H - PAD * 2;

const X_MIN = -1;
const X_MAX = 2.5;
const Y_MIN = -0.5;
const Y_MAX = 6.5;

const X_A = 1;
const Y_A = X_A * X_A;

function f(x: number): number {
  return x * x;
}

function scaleX(x: number): number {
  return PAD + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
}
function scaleY(y: number): number {
  return PAD + PLOT_H - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H;
}

function formatFloat(value: number, digits = 4): string {
  return value.toFixed(digits);
}

const CURVE_SAMPLES = 80;
const curvePoints: { x: number; y: number }[] = Array.from({ length: CURVE_SAMPLES + 1 }, (_, i) => {
  const x = X_MIN + (i / CURVE_SAMPLES) * (X_MAX - X_MIN);
  return { x, y: f(x) };
});
const curvePath = curvePoints
  .map((p, i) => `${i === 0 ? 'M' : 'L'}${scaleX(p.x)},${scaleY(p.y)}`)
  .join(' ');

// how far past A and B the secant line is drawn, in x-units, so it reads as a line rather than a segment
const LINE_EXTENSION = 0.6;

interface DiagramProps {
  h: number;
}

function LimitDiagram({ h }: DiagramProps) {
  const xB = X_A + h;
  const yB = f(xB);
  const slope = (yB - Y_A) / (xB - X_A);

  const xLeft = X_A - LINE_EXTENSION;
  const xRight = xB + LINE_EXTENSION;
  const yLeft = Y_A + slope * (xLeft - X_A);
  const yRight = Y_A + slope * (xRight - X_A);

  const gridXs = [-1, 0, 1, 2];
  const gridYs = [0, 2, 4, 6];

  return (
    <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`} role="img" accessibilityLabel={`Secant line with h equal to ${h.toFixed(2)}`}>
      {gridXs.map((x) => (
        <Line key={`v-${x}`} x1={scaleX(x)} y1={PAD} x2={scaleX(x)} y2={CHART_H - PAD} stroke={COLORS.grid} strokeWidth={1} />
      ))}
      {gridYs.map((y) => (
        <Line key={`h-${y}`} x1={PAD} y1={scaleY(y)} x2={CHART_W - PAD} y2={scaleY(y)} stroke={COLORS.grid} strokeWidth={1} />
      ))}

      {/* axes */}
      <Line x1={PAD} y1={scaleY(0)} x2={CHART_W - PAD} y2={scaleY(0)} stroke={COLORS.axis} strokeWidth={1.5} />
      <Line x1={scaleX(0)} y1={PAD} x2={scaleX(0)} y2={CHART_H - PAD} stroke={COLORS.axis} strokeWidth={1.5} />

      {/* y = x^2 */}
      <Path d={curvePath} fill="none" stroke={COLORS.curve} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

      {/* secant line through A and B, extended a bit past each point */}
      <Line
        x1={scaleX(xLeft)}
        y1={scaleY(yLeft)}
        x2={scaleX(xRight)}
        y2={scaleY(yRight)}
        stroke={COLORS.secant}
        strokeWidth={2.5}
      />

      {/* point A, fixed at x = 1 */}
      <Circle cx={scaleX(X_A)} cy={scaleY(Y_A)} r={6} fill={COLORS.pointA} />
      <SvgText x={scaleX(X_A) - 12} y={scaleY(Y_A) - 10} fontSize={12} fontWeight="bold" fill={COLORS.pointA}>
        A
      </SvgText>

      {/* point B, slides toward A as h shrinks */}
      <Circle cx={scaleX(xB)} cy={scaleY(yB)} r={6} fill={COLORS.pointB} />
      <SvgText x={scaleX(xB) + 8} y={scaleY(yB) - 10} fontSize={12} fontWeight="bold" fill={COLORS.pointB}>
        B
      </SvgText>
    </Svg>
  );
}

export default function CalculusLimitVisualizer() {
  const [h, setH] = useState(1);

  const { xB, yB, slope } = useMemo(() => {
    const x = X_A + h;
    const y = f(x);
    return { xB: x, yB: y, slope: (y - Y_A) / (x - X_A) };
  }, [h]);

  const isNearTangent = h <= 0.05;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Limits &amp; the Secant Line</Text>
      <Text style={styles.subheading}>Slide h toward 0 to watch the secant line become the tangent at x = 1.</Text>

      <View style={styles.readoutRow}>
        <Text style={styles.readoutLabel}>h =</Text>
        <Text style={styles.readoutValue}>{formatFloat(h, 2)}</Text>
      </View>

      <Slider
        style={styles.slider}
        minimumValue={0.01}
        maximumValue={1}
        step={0.01}
        value={h}
        onValueChange={setH}
        minimumTrackTintColor={COLORS.secant}
        maximumTrackTintColor={COLORS.border}
        thumbTintColor={COLORS.secant}
        accessibilityLabel="Delta x (h)"
      />
      <View style={styles.sliderTicks}>
        <Text style={styles.tickLabel}>0.01</Text>
        <Text style={styles.tickLabel}>1.0</Text>
      </View>

      <View style={styles.chartCard}>
        <LimitDiagram h={h} />
      </View>

      <Text style={styles.sectionLabel}>Breakdown</Text>
      <View style={styles.breakdown}>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Point A</Text>
          <Text style={styles.breakdownValue}>(1, 1)</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={[styles.breakdownLabel, { color: COLORS.pointB }]}>Point B</Text>
          <Text style={[styles.breakdownValue, { color: COLORS.pointB }]}>
            ({formatFloat(xB, 2)}, {formatFloat(yB, 2)})
          </Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>h (Δx)</Text>
          <Text style={styles.breakdownValue}>{formatFloat(h, 2)}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={[styles.breakdownLabel, { color: COLORS.secant }]}>Secant slope</Text>
          <Text style={[styles.breakdownValue, { color: COLORS.secant }]}>{formatFloat(slope)}</Text>
        </View>
        <Text style={[styles.hint, isNearTangent && styles.hintActive]}>
          {isNearTangent
            ? 'h is nearly 0 — the secant line is now almost indistinguishable from the tangent line.'
            : 'As h → 0, the secant slope (2 + h) approaches 2 — the derivative of x² at x = 1.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: COLORS.background,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  subheading: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 14,
  },
  readoutRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 4,
  },
  readoutLabel: {
    fontSize: 18,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  readoutValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderTicks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -6,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  tickLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    paddingVertical: 8,
  },
  sectionLabel: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: COLORS.textMuted,
  },
  breakdown: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  hint: {
    marginTop: 4,
    fontSize: 12.5,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  hintActive: {
    color: COLORS.secant,
    fontWeight: '600',
  },
});
