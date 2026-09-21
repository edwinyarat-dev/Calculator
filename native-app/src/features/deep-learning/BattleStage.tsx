import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import { Image, ImageSourcePropType, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient as SvgLinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { ParticleBurst } from './useSuccessEffects';
import { DL_COLORS } from './theme';

// The "guardian" the player faces down for a realm: a purely cosmetic layer
// over the real DeepLearningContext signals (lastResult/resultToken) — every
// correct answer lands a hit (spell bolt + impact burst + a floating "+XP"
// using the round's real XP gain), every miss jolts the hero with a shake +
// red flash. The "focus" bar is a direct, deterministic readout of real
// stage progress (stageIndex/totalStages) styled like a boss HP bar — no new
// scoring, HP, or MP is introduced.

const ARENA_W = 320;
const ARENA_H = 168;
const PORTRAIT_SIZE = 92;
const HERO_X = 28;
const ENEMY_X = ARENA_W - PORTRAIT_SIZE - 28;
const PORTRAIT_Y = ARENA_H - PORTRAIT_SIZE - 14;

export interface BattleStageProps {
  realmTitle: string;
  realmEmoji: string;
  guardianName: string;
  stageIndex: number;
  totalStages: number;
  lastResult: 'won' | 'lost' | null;
  resultToken: number;
  /** The real XP gained on the most recent win, shown as a floating reward number. */
  xpGain: number;
  heroImageSource?: ImageSourcePropType;
  enemyImageSource?: ImageSourcePropType;
}

function ArenaBackdrop() {
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="arenaGlow" cx="50%" cy="35%" r="75%">
          <Stop offset="0%" stopColor="#241a4a" stopOpacity={1} />
          <Stop offset="100%" stopColor={DL_COLORS.bgDeep} stopOpacity={1} />
        </RadialGradient>
        <SvgLinearGradient id="floorFade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={DL_COLORS.amethyst} stopOpacity={0} />
          <Stop offset="100%" stopColor={DL_COLORS.amethyst} stopOpacity={0.14} />
        </SvgLinearGradient>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill="url(#arenaGlow)" />
      <Rect x={0} y={ARENA_H * 0.55} width="100%" height={ARENA_H * 0.45} fill="url(#floorFade)" />
    </Svg>
  );
}

function FocusBar({ pct }: { pct: number }) {
  return (
    <View style={styles.focusTrack}>
      <View style={[styles.focusFill, { width: `${pct}%` }]} />
    </View>
  );
}

export function BattleStage({
  realmTitle,
  realmEmoji,
  guardianName,
  stageIndex,
  totalStages,
  lastResult,
  resultToken,
  xpGain,
  heroImageSource,
  enemyImageSource,
}: BattleStageProps) {
  const heroBob = useSharedValue(0);
  const enemyBob = useSharedValue(0);
  const heroShakeX = useSharedValue(0);
  const heroLurch = useSharedValue(0);
  const flash = useSharedValue(0);
  const boltX = useSharedValue(0);
  const boltOpacity = useSharedValue(0);
  const enemyHitFlash = useSharedValue(0);
  const burstProgress = useSharedValue(0);
  const rewardY = useSharedValue(0);
  const rewardOpacity = useSharedValue(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    heroBob.value = withRepeat(withSequence(withTiming(-5, { duration: 1700 }), withTiming(0, { duration: 1700 })), -1, true);
    enemyBob.value = withRepeat(withSequence(withTiming(-7, { duration: 1500 }), withTiming(0, { duration: 1500 })), -1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (lastResult === 'won') {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      heroLurch.value = withSequence(withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 260 }));

      boltOpacity.value = 0;
      boltX.value = 0;
      boltOpacity.value = withSequence(withTiming(1, { duration: 60 }), withDelay(280, withTiming(0, { duration: 90 })));
      boltX.value = withTiming(1, { duration: 400, easing: Easing.in(Easing.quad) });

      enemyHitFlash.value = withDelay(360, withSequence(withTiming(1, { duration: 70 }), withTiming(0, { duration: 220 })));

      burstProgress.value = 0;
      burstProgress.value = withDelay(380, withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) }));

      rewardY.value = 0;
      rewardOpacity.value = 0;
      rewardY.value = withDelay(400, withTiming(-36, { duration: 700, easing: Easing.out(Easing.quad) }));
      rewardOpacity.value = withDelay(400, withSequence(withTiming(1, { duration: 120 }), withDelay(400, withTiming(0, { duration: 200 }))));
    } else if (lastResult === 'lost') {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
      heroShakeX.value = withSequence(
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

  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: heroBob.value },
      { translateX: heroShakeX.value + heroLurch.value * 14 },
      { scale: 1 + heroLurch.value * 0.06 },
    ],
  }));
  const enemyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: enemyBob.value }],
  }));
  const enemyHitStyle = useAnimatedStyle(() => ({
    opacity: enemyHitFlash.value * 0.85,
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const boltStyle = useAnimatedStyle(() => {
    const travel = ENEMY_X - HERO_X;
    return {
      opacity: boltOpacity.value,
      transform: [{ translateX: HERO_X + PORTRAIT_SIZE * 0.7 + boltX.value * (travel - PORTRAIT_SIZE * 0.4) }],
    };
  });
  const rewardStyle = useAnimatedStyle(() => ({
    opacity: rewardOpacity.value,
    transform: [{ translateY: rewardY.value }],
  }));

  const focusPct = Math.max(0, 100 - (stageIndex / Math.max(1, totalStages)) * 100);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.realmPill}>
          <Text style={styles.realmPillText}>
            {realmEmoji} {realmTitle}
          </Text>
        </View>
        <View style={styles.guardianBlock}>
          <Text style={styles.guardianName}>💀 {guardianName}</Text>
          <FocusBar pct={focusPct} />
        </View>
      </View>

      <View style={styles.arena}>
        <ArenaBackdrop />

        <Animated.View style={[styles.portrait, { left: HERO_X, top: PORTRAIT_Y }, heroStyle]}>
          {heroImageSource ? (
            <Image source={heroImageSource} style={styles.portraitImage} resizeMode="contain" />
          ) : (
            <Text style={styles.portraitEmoji}>🧙‍♂️</Text>
          )}
        </Animated.View>

        <Animated.View style={[styles.portrait, styles.enemyPortrait, { left: ENEMY_X, top: PORTRAIT_Y }, enemyStyle]}>
          {enemyImageSource ? (
            <Image source={enemyImageSource} style={styles.portraitImage} resizeMode="contain" />
          ) : (
            <Text style={styles.portraitEmoji}>👹</Text>
          )}
          <Animated.View style={[styles.enemyHitOverlay, enemyHitStyle]} pointerEvents="none" />
        </Animated.View>

        <Animated.View style={[styles.bolt, { top: PORTRAIT_Y + PORTRAIT_SIZE * 0.45 }, boltStyle]} pointerEvents="none" />

        <View style={[styles.burstAnchor, { left: ENEMY_X, top: PORTRAIT_Y }]} pointerEvents="none">
          <ParticleBurst progress={burstProgress} />
        </View>

        <Animated.Text style={[styles.rewardText, { left: ENEMY_X + PORTRAIT_SIZE * 0.2, top: PORTRAIT_Y - 4 }, rewardStyle]}>
          +{xpGain} XP
        </Animated.Text>

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
    padding: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  realmPill: {
    borderWidth: 1,
    borderColor: DL_COLORS.border,
    backgroundColor: 'rgba(11, 15, 25, 0.8)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  realmPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: DL_COLORS.amethyst,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  guardianBlock: {
    width: 150,
    alignItems: 'flex-end',
  },
  guardianName: {
    fontSize: 11,
    fontWeight: '800',
    color: DL_COLORS.danger,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  focusTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: DL_COLORS.dangerSoft,
    overflow: 'hidden',
  },
  focusFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: DL_COLORS.danger,
    shadowColor: DL_COLORS.danger,
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  arena: {
    height: ARENA_H,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: DL_COLORS.bgDeep,
  },
  portrait: {
    position: 'absolute',
    width: PORTRAIT_SIZE,
    height: PORTRAIT_SIZE,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: DL_COLORS.amethyst,
    backgroundColor: DL_COLORS.amethystSoft,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: DL_COLORS.amethyst,
    shadowOpacity: 0.7,
    shadowRadius: 12,
  },
  enemyPortrait: {
    borderColor: DL_COLORS.danger,
    backgroundColor: DL_COLORS.dangerSoft,
    shadowColor: DL_COLORS.danger,
  },
  portraitImage: {
    width: '82%',
    height: '82%',
  },
  portraitEmoji: {
    fontSize: 42,
  },
  enemyHitOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  bolt: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: DL_COLORS.sky,
    shadowColor: DL_COLORS.sky,
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  burstAnchor: {
    position: 'absolute',
    width: PORTRAIT_SIZE,
    height: PORTRAIT_SIZE,
  },
  rewardText: {
    position: 'absolute',
    fontSize: 15,
    fontWeight: '800',
    color: DL_COLORS.reward,
    textShadowColor: 'rgba(232, 121, 249, 0.7)',
    textShadowRadius: 8,
  },
  hurtFlash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 76, 76, 0.22)',
  },
});
