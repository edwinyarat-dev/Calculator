import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Line, Polygon, Rect, Circle as SvgCircle, Text as SvgText } from 'react-native-svg';
import { theme } from '../theme';

const COLORS = {
  surface: theme.color.surface,
  border: theme.color.border,
  text: theme.color.text,
  textMuted: theme.color.textMuted,
  accent: theme.color.grape,
};

type Shape = 'rectangle' | 'circle' | 'triangle';

const SHAPES: { key: Shape; label: string; emoji: string }[] = [
  { key: 'rectangle', label: 'Rectangle', emoji: '▭' },
  { key: 'circle', label: 'Circle', emoji: '◯' },
  { key: 'triangle', label: 'Triangle', emoji: '△' },
];

function fmtDim(n: number): string {
  return String(Math.round(n * 100) / 100);
}
function fmtPlain(n: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(n * 100) / 100);
}

const CANVAS_W = 260;
const CANVAS_H = 200;
const AVAIL_W = 190;
const AVAIL_H = 150;

function ShapeDiagram({ shape, width, height, radius, side }: { shape: Shape; width: number; height: number; radius: number; side: number }) {
  if (shape === 'rectangle') {
    const scale = Math.min(AVAIL_W / width, AVAIL_H / height);
    const rw = width * scale;
    const rh = height * scale;
    const x = (CANVAS_W - rw) / 2;
    const y = (CANVAS_H - rh) / 2;
    return (
      <Svg width="100%" height={CANVAS_H} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} role="img" accessibilityLabel="Rectangle diagram">
        <Rect x={x} y={y} width={rw} height={rh} fill={COLORS.accent} fillOpacity={0.16} stroke={COLORS.accent} strokeWidth={2.5} rx={4} />
        <SvgText x={x + rw / 2} y={y + rh + 20} fontSize={11} fill={COLORS.textMuted} textAnchor="middle">width = {fmtDim(width)}</SvgText>
        <SvgText x={x - 12} y={y + rh / 2} fontSize={11} fill={COLORS.textMuted} textAnchor="middle" transform={`rotate(-90 ${x - 12} ${y + rh / 2})`}>height = {fmtDim(height)}</SvgText>
      </Svg>
    );
  }
  if (shape === 'circle') {
    const scale = Math.min(AVAIL_W, AVAIL_H) / 2 / radius;
    const r = radius * scale;
    const cx = CANVAS_W / 2;
    const cy = CANVAS_H / 2;
    return (
      <Svg width="100%" height={CANVAS_H} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} role="img" accessibilityLabel="Circle diagram">
        <SvgCircle cx={cx} cy={cy} r={r} fill={COLORS.accent} fillOpacity={0.16} stroke={COLORS.accent} strokeWidth={2.5} />
        <Line x1={cx} y1={cy} x2={cx + r} y2={cy} stroke={COLORS.accent} strokeWidth={1.5} strokeDasharray="3,3" />
        <SvgText x={cx + r / 2} y={cy - 8} fontSize={11} fill={COLORS.textMuted} textAnchor="middle">r = {fmtDim(radius)}</SvgText>
      </Svg>
    );
  }
  const h = side * Math.sqrt(3) / 2;
  const scale = Math.min(AVAIL_W / side, AVAIL_H / h);
  const tw = side * scale;
  const th = h * scale;
  const cx = CANVAS_W / 2;
  const topY = (CANVAS_H - th) / 2;
  const points = `${cx},${topY} ${cx - tw / 2},${topY + th} ${cx + tw / 2},${topY + th}`;
  return (
    <Svg width="100%" height={CANVAS_H} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} role="img" accessibilityLabel="Triangle diagram">
      <Polygon points={points} fill={COLORS.accent} fillOpacity={0.16} stroke={COLORS.accent} strokeWidth={2.5} />
      <SvgText x={cx} y={topY + th + 20} fontSize={11} fill={COLORS.textMuted} textAnchor="middle">side = {fmtDim(side)}</SvgText>
    </Svg>
  );
}

export default function GeometryModule() {
  const [shape, setShape] = useState<Shape>('rectangle');
  const [width, setWidth] = useState('6');
  const [height, setHeight] = useState('4');
  const [radius, setRadius] = useState('5');
  const [side, setSide] = useState('6');

  const w = Math.max(0.1, Number(width) || 0.1);
  const h = Math.max(0.1, Number(height) || 0.1);
  const r = Math.max(0.1, Number(radius) || 0.1);
  const s = Math.max(0.1, Number(side) || 0.1);

  let area = 0;
  let perimeter = 0;
  let perimLabel = 'Perimeter';
  if (shape === 'rectangle') {
    area = w * h;
    perimeter = 2 * (w + h);
  } else if (shape === 'circle') {
    area = Math.PI * r * r;
    perimeter = 2 * Math.PI * r;
    perimLabel = 'Circumference';
  } else {
    area = (Math.sqrt(3) / 4) * s * s;
    perimeter = 3 * s;
  }

  return (
    <View style={styles.container}>
      <View style={styles.shapeRow}>
        {SHAPES.map((sh) => (
          <Pressable
            key={sh.key}
            onPress={() => setShape(sh.key)}
            style={[styles.shapeBtn, shape === sh.key && styles.shapeBtnActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: shape === sh.key }}
          >
            <Text style={[styles.shapeBtnLabel, shape === sh.key && styles.shapeBtnLabelActive]}>{sh.emoji} {sh.label}</Text>
          </Pressable>
        ))}
      </View>

      {shape === 'rectangle' && (
        <>
          <Field label="Width" value={width} onChangeText={setWidth} />
          <Field label="Height" value={height} onChangeText={setHeight} />
        </>
      )}
      {shape === 'circle' && <Field label="Radius" value={radius} onChangeText={setRadius} />}
      {shape === 'triangle' && <Field label="Side length" value={side} onChangeText={setSide} />}

      <View style={styles.statsRow}>
        <View style={styles.statTile}>
          <Text style={styles.statLabel}>Area</Text>
          <Text style={styles.statValue}>{fmtPlain(area)} sq units</Text>
        </View>
        <View style={styles.statTile}>
          <Text style={styles.statLabel}>{perimLabel}</Text>
          <Text style={styles.statValue}>{fmtPlain(perimeter)} units</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Step-by-step breakdown</Text>
      <View style={styles.breakdown}>
        {shape === 'rectangle' && (
          <>
            <StepRow n={1} text="A rectangle's area is width × height, and its perimeter is 2 × (width + height)." />
            <StepRow n={2} text={`width = ${fmtDim(w)}, height = ${fmtDim(h)}.`} />
            <StepRow n={3} text={`Area = ${fmtDim(w)} × ${fmtDim(h)} = ${fmtPlain(area)} square units.`} />
            <StepRow n={4} text={`Perimeter = 2 × (${fmtDim(w)} + ${fmtDim(h)}) = ${fmtPlain(perimeter)} units.`} />
          </>
        )}
        {shape === 'circle' && (
          <>
            <StepRow n={1} text="A circle's area is π × radius², and its circumference is 2 × π × radius." />
            <StepRow n={2} text={`radius = ${fmtDim(r)}.`} />
            <StepRow n={3} text={`Area = π × ${fmtDim(r)}² ≈ ${fmtPlain(area)} square units.`} />
            <StepRow n={4} text={`Circumference = 2 × π × ${fmtDim(r)} ≈ ${fmtPlain(perimeter)} units.`} />
          </>
        )}
        {shape === 'triangle' && (
          <>
            <StepRow n={1} text="An equilateral triangle's area is (√3⁄4) × side², and its perimeter is 3 × side." />
            <StepRow n={2} text={`side = ${fmtDim(s)}.`} />
            <StepRow n={3} text={`Area = (√3⁄4) × ${fmtDim(s)}² ≈ ${fmtPlain(area)} square units.`} />
            <StepRow n={4} text={`Perimeter = 3 × ${fmtDim(s)} = ${fmtPlain(perimeter)} units.`} />
          </>
        )}
      </View>

      <Text style={styles.sectionLabel}>Drawn to scale</Text>
      <View style={styles.chartCard}>
        <ShapeDiagram shape={shape} width={w} height={h} radius={r} side={s} />
      </View>
    </View>
  );
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (t: string) => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        accessibilityLabel={label}
      />
    </View>
  );
}

function StepRow({ n, text }: { n: number; text: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNum}><Text style={styles.stepNumText}>{n}</Text></View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18 },
  shapeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  shapeBtn: {
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  shapeBtnActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  shapeBtnLabel: {
    fontSize: 13.5,
    fontFamily: theme.font.bodyBold,
    color: COLORS.text,
  },
  shapeBtnLabelActive: {
    color: '#FFFFFF',
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: theme.font.bodyExtraBold,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  fieldInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: theme.font.bodyExtraBold,
    color: COLORS.text,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  statTile: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: theme.radius.md,
    padding: 12,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: theme.font.bodyExtraBold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: COLORS.textMuted,
  },
  statValue: {
    marginTop: 4,
    fontSize: 16,
    fontFamily: theme.font.display,
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
  breakdown: {
    backgroundColor: COLORS.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: 16,
    gap: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: theme.radius.pill,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 11.5,
    fontFamily: theme.font.bodyExtraBold,
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    fontFamily: theme.font.bodySemi,
    color: COLORS.text,
    lineHeight: 18,
    marginTop: 1,
  },
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    paddingVertical: 10,
  },
});
