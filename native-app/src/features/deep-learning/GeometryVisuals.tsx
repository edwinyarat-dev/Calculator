import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';
import { DL_COLORS } from './theme';

// Purpose-built worked-example visuals for Shape Architect's Learn-the-Move
// walkthrough — an actual traced polygon and a filling circle, not a reused
// bar chart. Perimeter and area are two different questions about a shape
// (distance around vs. space inside), so the two visuals are deliberately
// different shapes of animation, not the same effect recolored.

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const TRACE_W = 220;
const TRACE_H = 150;

interface Vertex {
  x: number;
  y: number;
}

function rectangleVertices(w: number, h: number): Vertex[] {
  const maxDim = Math.max(w, h);
  const scale = Math.min((TRACE_W - 70) / maxDim, (TRACE_H - 60) / maxDim);
  const sw = w * scale;
  const sh = h * scale;
  const cx = TRACE_W / 2;
  const cy = TRACE_H / 2;
  return [
    { x: cx - sw / 2, y: cy - sh / 2 },
    { x: cx + sw / 2, y: cy - sh / 2 },
    { x: cx + sw / 2, y: cy + sh / 2 },
    { x: cx - sw / 2, y: cy + sh / 2 },
  ];
}

function triangleVertices(s: number): Vertex[] {
  const scale = Math.min((TRACE_W - 70) / s, (TRACE_H - 60) / (s * 0.87));
  const ss = s * scale;
  const h = ss * (Math.sqrt(3) / 2);
  const cx = TRACE_W / 2;
  const topY = TRACE_H / 2 - h / 2;
  const botY = TRACE_H / 2 + h / 2;
  return [
    { x: cx, y: topY },
    { x: cx + ss / 2, y: botY },
    { x: cx - ss / 2, y: botY },
  ];
}

function EdgeHighlight({ from, to, delay, reducedMotion }: { from: Vertex; to: Vertex; delay: number; reducedMotion: boolean }) {
  const progress = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    if (reducedMotion) return;
    progress.value = withDelay(delay, withTiming(1, { duration: 380 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const animatedProps = useAnimatedProps(() => ({ opacity: progress.value }));
  return (
    <AnimatedLine
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke={DL_COLORS.lime}
      strokeWidth={5}
      strokeLinecap="round"
      animatedProps={animatedProps}
    />
  );
}

export interface PerimeterTraceProps {
  shape: 'rectangle' | 'triangle';
  sides: number[];
  /** One label per physical edge, in the same order edges are walked (e.g. ["5","3","5","3"]). */
  edgeLabels: string[];
  totalLabel: string;
}

/** Traces a rectangle or triangle's outline edge-by-edge, labeling each side as it lights up, then shows the running total — "perimeter" made literal: walk the edge, add what you cross. */
export function PerimeterTrace({ shape, sides, edgeLabels, totalLabel }: PerimeterTraceProps) {
  const reducedMotion = useReducedMotion();
  const vertices = shape === 'rectangle' ? rectangleVertices(sides[0], sides[1]) : triangleVertices(sides[0]);
  const edges = vertices.map((v, i) => ({ from: v, to: vertices[(i + 1) % vertices.length] }));
  const centroid = {
    x: vertices.reduce((s, v) => s + v.x, 0) / vertices.length,
    y: vertices.reduce((s, v) => s + v.y, 0) / vertices.length,
  };

  return (
    <View style={styles.traceWrap}>
      <View>
        <Svg width={TRACE_W} height={TRACE_H} viewBox={`0 0 ${TRACE_W} ${TRACE_H}`} role="img" accessibilityLabel="Traced shape outline">
          {edges.map((e, i) => (
            <Line key={`base-${i}`} x1={e.from.x} y1={e.from.y} x2={e.to.x} y2={e.to.y} stroke={DL_COLORS.border} strokeWidth={2} />
          ))}
          {edges.map((e, i) => (
            <EdgeHighlight key={`hl-${i}`} from={e.from} to={e.to} delay={i * 280} reducedMotion={reducedMotion} />
          ))}
        </Svg>
        <View style={styles.traceLabelLayer} pointerEvents="none">
          {edges.map((e, i) => {
            const midX = (e.from.x + e.to.x) / 2;
            const midY = (e.from.y + e.to.y) / 2;
            const dx = midX - centroid.x;
            const dy = midY - centroid.y;
            const norm = Math.hypot(dx, dy) || 1;
            const offX = midX + (dx / norm) * 18;
            const offY = midY + (dy / norm) * 18;
            return (
              <Text key={i} style={[styles.edgeLabel, { left: offX - 16, top: offY - 9 }]}>
                {edgeLabels[i]}
              </Text>
            );
          })}
        </View>
      </View>
      <Text style={styles.traceTotal}>{totalLabel}</Text>
    </View>
  );
}

export interface AreaFillProps {
  formulaLabel: string;
  areaLabel: string;
}

/** A circle filling in from its center — area as "the space covered," visually contrasted against PerimeterTrace's outline-walk so the perimeter/area distinction is felt, not just stated. */
export function AreaFill({ formulaLabel, areaLabel }: AreaFillProps) {
  const reducedMotion = useReducedMotion();
  const fill = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) return;
    fill.value = withDelay(200, withTiming(1, { duration: 750 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    r: 6 + fill.value * 54,
    opacity: 0.3 + fill.value * 0.5,
  }));

  return (
    <View style={styles.areaWrap}>
      <Svg width={150} height={150} viewBox="0 0 150 150" role="img" accessibilityLabel="Circle filling in to show area">
        <Circle cx={75} cy={75} r={60} fill="none" stroke={DL_COLORS.border} strokeWidth={2} strokeDasharray="4,4" />
        <AnimatedCircle cx={75} cy={75} fill={DL_COLORS.lime} animatedProps={animatedProps} />
      </Svg>
      <Text style={styles.areaFormula}>{formulaLabel}</Text>
      <Text style={styles.areaTotal}>{areaLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  traceWrap: {
    alignItems: 'center',
    gap: 10,
  },
  traceLabelLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  edgeLabel: {
    position: 'absolute',
    fontSize: 13,
    fontWeight: '800',
    color: DL_COLORS.lime,
    width: 32,
    textAlign: 'center',
  },
  traceTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: DL_COLORS.text,
    textAlign: 'center',
  },
  areaWrap: {
    alignItems: 'center',
    gap: 6,
  },
  areaFormula: {
    fontSize: 14,
    fontWeight: '700',
    color: DL_COLORS.textMuted,
  },
  areaTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: DL_COLORS.lime,
  },
});
