import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { theme } from '../theme';

const COLORS = {
  surface: theme.color.surface,
  border: theme.color.border,
  text: theme.color.text,
  textMuted: theme.color.textMuted,
  axis: '#9AA1B2',
  grid: '#E7EAF1',
  circleStroke: '#4B5568',
  arm: theme.color.sky, // the module's own accent — sweeps the arm
  sin: '#F5871F', // orange — tracks sin(theta) on the Y-axis (fixed, taught concept)
  cos: '#1F9D55', // green — tracks cos(theta) on the X-axis (fixed, taught concept)
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
      <Circle cx={tipX} cy={tipY} r={7} fill={COLORS.arm} />

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
      <Text style={styles.sectionLabel}>Spin it!</Text>
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
    padding: 18,
  },
  readoutRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 4,
  },
  readoutValue: {
    fontSize: 26,
    fontFamily: theme.font.display,
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
    fontFamily: theme.font.bodySemi,
    color: COLORS.textMuted,
  },
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    paddingVertical: 8,
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
  breakdown: {
    backgroundColor: COLORS.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: 16,
    gap: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 14,
    fontFamily: theme.font.bodyBold,
    color: COLORS.text,
  },
  breakdownValue: {
    fontSize: 17,
    fontFamily: theme.font.display,
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
});
