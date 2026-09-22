import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';
import { DL_COLORS } from './theme';

// A single purpose-built visual for Circle Spinner's Learn-the-Move: the
// unit circle itself, with a dot at a given angle and its cosine/sine
// projections drawn as actual perpendicular drop-lines — the definition
// made literal, since Stage 2's live canvas already assumes the player
// knows "sin is the vertical one, cos is the horizontal one" without ever
// having been told why.

const toRad = (deg: number) => (deg * Math.PI) / 180;
const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 78;

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function FadeInLine({ x1, y1, x2, y2, color, delay, reducedMotion, strokeWidth = 4 }: {
  x1: number; y1: number; x2: number; y2: number; color: string; delay: number; reducedMotion: boolean; strokeWidth?: number;
}) {
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    if (reducedMotion) return;
    opacity.value = withDelay(delay, withTiming(1, { duration: 360 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const animatedProps = useAnimatedProps(() => ({ opacity: opacity.value }));
  return <AnimatedLine x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" animatedProps={animatedProps} />;
}

export interface UnitCircleVisualProps {
  angleDeg: number;
  showCos?: boolean;
  showSin?: boolean;
  caption: string;
}

/** The unit circle with a dot at `angleDeg` and its cosine (horizontal) and/or sine (vertical) projection literally drawn as drop-lines to each axis. */
export function UnitCircleVisual({ angleDeg, showCos, showSin, caption }: UnitCircleVisualProps) {
  const reducedMotion = useReducedMotion();
  const rad = toRad(angleDeg);
  const cosValue = Math.cos(rad);
  const sinValue = Math.sin(rad);
  const dotX = CENTER + cosValue * RADIUS;
  const dotY = CENTER - sinValue * RADIUS;

  const dotOpacity = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    if (reducedMotion) return;
    dotOpacity.value = withDelay(150, withTiming(1, { duration: 300 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const dotAnimatedProps = useAnimatedProps(() => ({ opacity: dotOpacity.value }));

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" accessibilityLabel="Unit circle with angle projections">
        <Line x1={0} y1={CENTER} x2={SIZE} y2={CENTER} stroke={DL_COLORS.border} strokeWidth={1.5} />
        <Line x1={CENTER} y1={0} x2={CENTER} y2={SIZE} stroke={DL_COLORS.border} strokeWidth={1.5} />
        <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke={DL_COLORS.textMuted} strokeWidth={2} />

        <FadeInLine x1={CENTER} y1={CENTER} x2={dotX} y2={dotY} color={DL_COLORS.text} delay={0} reducedMotion={reducedMotion} strokeWidth={2} />

        {showCos && (
          <FadeInLine x1={CENTER} y1={CENTER} x2={dotX} y2={CENTER} color={DL_COLORS.amethyst} delay={350} reducedMotion={reducedMotion} />
        )}
        {showSin && (
          <FadeInLine x1={dotX} y1={CENTER} x2={dotX} y2={dotY} color={DL_COLORS.lime} delay={showCos ? 650 : 350} reducedMotion={reducedMotion} />
        )}

        <AnimatedCircle cx={dotX} cy={dotY} r={6} fill={DL_COLORS.text} animatedProps={dotAnimatedProps} />
      </Svg>
      <View style={styles.legendRow}>
        {showCos && (
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: DL_COLORS.amethyst }]} />
            <Text style={styles.legendText}>cos({angleDeg}°) = {cosValue.toFixed(2)}</Text>
          </View>
        )}
        {showSin && (
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: DL_COLORS.lime }]} />
            <Text style={styles.legendText}>sin({angleDeg}°) = {sinValue.toFixed(2)}</Text>
          </View>
        )}
      </View>
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '700',
    color: DL_COLORS.text,
  },
  caption: {
    fontSize: 12.5,
    fontWeight: '600',
    color: DL_COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
