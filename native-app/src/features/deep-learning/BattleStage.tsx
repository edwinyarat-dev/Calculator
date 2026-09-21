import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ParticleBurst } from './useSuccessEffects';
import { DL_COLORS } from './theme';

// The "guardian" the player faces down for a realm: a purely cosmetic layer
// over the real DeepLearningContext signals (lastResult/resultToken) — every
// correct answer lands a hit (particle burst + scale pop), every miss jolts
// the guardian's ward with a shake + red flash. No new scoring, HP, or MP is
// introduced here; this only reacts to results the engine already computed.

export interface BattleStageProps {
  realmTitle: string;
  realmEmoji: string;
  stageIndex: number;
  totalStages: number;
  lastResult: 'won' | 'lost' | null;
  resultToken: number;
}

export function BattleStage({ realmTitle, realmEmoji, stageIndex, totalStages, lastResult, resultToken }: BattleStageProps) {
  const scale = useSharedValue(1);
  const shakeX = useSharedValue(0);
  const flash = useSharedValue(0);
  const burstProgress = useSharedValue(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (lastResult === 'won') {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      scale.value = withSequence(
        withTiming(1.18, { duration: 140, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 240, easing: Easing.out(Easing.quad) })
      );
      burstProgress.value = 0;
      burstProgress.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    } else if (lastResult === 'lost') {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
      shakeX.value = withSequence(
        withTiming(-8, { duration: 55 }),
        withTiming(8, { duration: 55 }),
        withTiming(-6, { duration: 55 }),
        withTiming(6, { duration: 55 }),
        withTiming(0, { duration: 55 })
      );
      flash.value = withSequence(withTiming(1, { duration: 80 }), withTiming(0, { duration: 260 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultToken]);

  const guardianStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: shakeX.value }],
  }));
  const flashStyle = useAnimatedStyle(() => ({
    opacity: flash.value,
  }));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.realmName}>{realmTitle}</Text>
        <Text style={styles.stageCaption}>
          Stage {stageIndex + 1} of {totalStages}
        </Text>
      </View>

      <View style={styles.arena}>
        <Animated.View style={[styles.guardianRing, guardianStyle]}>
          <Text style={styles.guardianEmoji}>{realmEmoji}</Text>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <ParticleBurst progress={burstProgress} />
          </View>
        </Animated.View>
        <Animated.View style={[styles.hurtFlash, flashStyle]} pointerEvents="none" />
      </View>
    </View>
  );
}

export default BattleStage;

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: DL_COLORS.border,
    backgroundColor: DL_COLORS.surface,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  realmName: {
    fontSize: 13,
    fontWeight: '800',
    color: DL_COLORS.amethyst,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  stageCaption: {
    fontSize: 11,
    fontWeight: '700',
    color: DL_COLORS.textMuted,
  },
  arena: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  guardianRing: {
    width: 84,
    height: 84,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: DL_COLORS.amethyst,
    backgroundColor: DL_COLORS.amethystSoft,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: DL_COLORS.amethyst,
    shadowOpacity: 0.7,
    shadowRadius: 14,
  },
  guardianEmoji: {
    fontSize: 40,
  },
  hurtFlash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 76, 76, 0.22)',
    borderRadius: 20,
  },
});
