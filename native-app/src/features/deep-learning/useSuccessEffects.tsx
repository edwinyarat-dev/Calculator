import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';
import { DL_COLORS } from './theme';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const PARTICLE_COUNT = 12;
const BURST_DURATION_MS = 600;

interface ParticleDotProps {
  progress: SharedValue<number>;
  angle: number;
  distance: number;
  color: string;
}

function ParticleDot({ progress, angle, distance, color }: ParticleDotProps) {
  const rad = (angle * Math.PI) / 180;
  const animatedProps = useAnimatedProps(() => {
    const dist = progress.value * distance;
    return {
      x: 50 + Math.cos(rad) * dist - 3,
      y: 50 + Math.sin(rad) * dist - 3,
      opacity: 1 - progress.value,
    };
  });
  return <AnimatedRect animatedProps={animatedProps} width={6} height={6} rx={1} fill={color} />;
}

/** Sprays 12 small neon squares outward from the center of its box, fading over ~600ms. */
export function ParticleBurst({ progress }: { progress: SharedValue<number> }) {
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        angle: (360 / PARTICLE_COUNT) * i,
        distance: 34 + (i % 3) * 10,
        color: i % 2 === 0 ? DL_COLORS.lime : DL_COLORS.amethyst,
      })),
    []
  );

  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100" style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <ParticleDot key={p.id} progress={progress} angle={p.angle} distance={p.distance} color={p.color} />
      ))}
    </Svg>
  );
}

/**
 * The "Juice Engine" success payoff: on every stage win, fires three things at once —
 * a haptic success pulse, a scale-up pop on the target node, and a 12-square neon
 * particle burst that fades out over ~600ms.
 */
export function useSuccessEffects() {
  const scale = useSharedValue(1);
  const burstProgress = useSharedValue(0);
  const [isBursting, setIsBursting] = useState(false);

  const targetPopStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const trigger = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    scale.value = withSequence(
      withTiming(1.2, { duration: 150, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 250, easing: Easing.out(Easing.quad) })
    );

    burstProgress.value = 0;
    burstProgress.value = withTiming(1, { duration: BURST_DURATION_MS, easing: Easing.out(Easing.cubic) });
    setIsBursting(true);
    setTimeout(() => setIsBursting(false), BURST_DURATION_MS + 60);
  }, [scale, burstProgress]);

  return { targetPopStyle, burstProgress, isBursting, trigger };
}
