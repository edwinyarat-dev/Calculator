import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

const COLORS = {
  background: '#FFFFFF',
  surface: '#F4F6FA',
  border: '#DCE1EA',
  text: '#1B1E27',
  textMuted: '#6B7280',
  axis: '#9AA1B2',
  grid: '#E7EAF1',
  circleStroke: '#4B5568',
  arm: '#2F6FED',
  sin: '#F5871F', // orange — tracks sin(theta) on the Y-axis
  cos: '#1F9D55', // green — tracks cos(theta) on the X-axis
  dashed: '#B7BDCB',
};

const SIZE = 300;
const PADDING = 34;
const CENTER = SIZE / 2;
const RADIUS_PX = (SIZE - PADDING * 2) / 2;
const GRID_STEPS = [-1, -0.5, 0, 0.5, 1];

function toScreenX(mathX: number): number {
  return CENTER + mathX * RADIUS_PX;
}
function toScreenY(mathY: number): number {
  return CENTER - mathY * RADIUS_PX;
}

function formatFloat(value: number, digits = 4): string {
  return value.toFixed(digits);
}

interface UnitCircleProps {
  degrees: number;
  sinValue: number;
  cosValue: number;
}

function UnitCircleDiagram({ degrees, sinValue, cosValue }: UnitCircleProps) {
  const tipX = toScreenX(cosValue);
  const tipY = toScreenY(sinValue);
  const originX = toScreenX(0);
  const originY = toScreenY(0);

  return (
    <Svg width="100%" height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" accessibilityLabel={`Unit circle at ${Math.round(degrees)} degrees`}>
      {/* coordinate grid */}
      {GRID_STEPS.map((v) => (
        <Line key={`v-${v}`} x1={toScreenX(v)} y1={PADDING} x2={toScreenX(v)} y2={SIZE - PADDING} stroke={COLORS.grid} strokeWidth={1} />
      ))}
      {GRID_STEPS.map((v) => (
        <Line key={`h-${v}`} x1={PADDING} y1={toScreenY(v)} x2={SIZE - PADDING} y2={toScreenY(v)} stroke={COLORS.grid} strokeWidth={1} />
      ))}

      {/* axes */}
      <Line x1={PADDING} y1={originY} x2={SIZE - PADDING} y2={originY} stroke={COLORS.axis} strokeWidth={1.5} />
      <Line x1={originX} y1={PADDING} x2={originX} y2={SIZE - PADDING} stroke={COLORS.axis} strokeWidth={1.5} />
      <SvgText x={SIZE - PADDING + 10} y={originY + 4} fontSize={11} fill={COLORS.textMuted}>1</SvgText>
      <SvgText x={PADDING - 14} y={originY + 4} fontSize={11} fill={COLORS.textMuted}>-1</SvgText>
      <SvgText x={originX - 4} y={PADDING - 10} fontSize={11} fill={COLORS.textMuted} textAnchor="middle">1</SvgText>
      <SvgText x={originX - 8} y={SIZE - PADDING + 16} fontSize={11} fill={COLORS.textMuted} textAnchor="middle">-1</SvgText>

      {/* unit circle */}
      <Circle cx={CENTER} cy={CENTER} r={RADIUS_PX} fill="none" stroke={COLORS.circleStroke} strokeWidth={2} />

      {/* dashed triangle legs connecting the arm's tip to each axis */}
      <Line x1={tipX} y1={tipY} x2={tipX} y2={originY} stroke={COLORS.dashed} strokeWidth={1.5} strokeDasharray="4,4" />
      <Line x1={tipX} y1={tipY} x2={originX} y2={tipY} stroke={COLORS.dashed} strokeWidth={1.5} strokeDasharray="4,4" />

      {/* cos(theta) projection, drawn along the X-axis */}
      <Line x1={originX} y1={originY} x2={tipX} y2={originY} stroke={COLORS.cos} strokeWidth={5} strokeLinecap="round" />
      {/* sin(theta) projection, drawn along the Y-axis */}
      <Line x1={originX} y1={originY} x2={originX} y2={tipY} stroke={COLORS.sin} strokeWidth={5} strokeLinecap="round" />

      {/* interactive vector arm, sweeps as the slider changes */}
      <Line x1={originX} y1={originY} x2={tipX} y2={tipY} stroke={COLORS.arm} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={tipX} cy={tipY} r={6} fill={COLORS.arm} />

      <SvgText x={CENTER + (tipX - originX) / 2} y={originY - 8} fontSize={11} fontWeight="bold" fill={COLORS.cos} textAnchor="middle">
        cos θ
      </SvgText>
      <SvgText x={originX + 10} y={originY + (tipY - originY) / 2} fontSize={11} fontWeight="bold" fill={COLORS.sin}>
        sin θ
      </SvgText>
    </Svg>
  );
}

export default function TrigonometryUnitCircle() {
  const [degrees, setDegrees] = useState(45);

  const { radians, sinValue, cosValue } = useMemo(() => {
    const rad = (degrees * Math.PI) / 180;
    return { radians: rad, sinValue: Math.sin(rad), cosValue: Math.cos(rad) };
  }, [degrees]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Unit Circle</Text>
      <Text style={styles.subheading}>Drag the slider to sweep the angle around the circle.</Text>

      <View style={styles.readoutRow}>
        <Text style={styles.readoutValue}>{Math.round(degrees)}°</Text>
        <Text style={styles.readoutDivider}>·</Text>
        <Text style={styles.readoutValue}>{formatFloat(radians, 3)} rad</Text>
      </View>

      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={360}
        step={1}
        value={degrees}
        onValueChange={setDegrees}
        minimumTrackTintColor={COLORS.arm}
        maximumTrackTintColor={COLORS.border}
        thumbTintColor={COLORS.arm}
        accessibilityLabel="Angle in degrees"
      />
      <View style={styles.sliderTicks}>
        <Text style={styles.tickLabel}>0°</Text>
        <Text style={styles.tickLabel}>90°</Text>
        <Text style={styles.tickLabel}>180°</Text>
        <Text style={styles.tickLabel}>270°</Text>
        <Text style={styles.tickLabel}>360°</Text>
      </View>

      <View style={styles.chartCard}>
        <UnitCircleDiagram degrees={degrees} sinValue={sinValue} cosValue={cosValue} />
      </View>

      <Text style={styles.sectionLabel}>Breakdown</Text>
      <View style={styles.breakdown}>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>θ (degrees)</Text>
          <Text style={styles.breakdownValue}>{formatFloat(degrees, 1)}°</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>θ (radians)</Text>
          <Text style={styles.breakdownValue}>{formatFloat(radians, 4)}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={[styles.breakdownLabel, { color: COLORS.sin }]}>sin(θ)</Text>
          <Text style={[styles.breakdownValue, { color: COLORS.sin }]}>{formatFloat(sinValue)}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={[styles.breakdownLabel, { color: COLORS.cos }]}>cos(θ)</Text>
          <Text style={[styles.breakdownValue, { color: COLORS.cos }]}>{formatFloat(cosValue)}</Text>
        </View>
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
    gap: 10,
    marginBottom: 4,
  },
  readoutValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  readoutDivider: {
    fontSize: 18,
    color: COLORS.textMuted,
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
});
