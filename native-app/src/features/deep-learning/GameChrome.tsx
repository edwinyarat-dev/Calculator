import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { awardXP, markRealmCleared } from '../../utils/gameState';
import { DeepLearningProvider, useDeepLearning } from './DeepLearningContext';
import LevelSelector from './LevelSelector';
import { DL_COLORS } from './theme';
import type { MathStageConfig } from './types';

// Shared chrome around every 4-stage math module: the XP bar + streak badge,
// the encouragement-shield near-miss banner, and the stage-cleared banner.
// Pulled out of the first module (Trigonometry) once it became clear every
// subsequent module (Arithmetic, Geometry, …) would need the exact same
// shell around its own stage components.

export function ProgressHeader({ maxXp }: { maxXp: number }) {
  const { xpEarned, streakCount } = useDeepLearning();
  const pct = Math.min(100, (xpEarned / maxXp) * 100);
  const isHot = streakCount >= 3;

  return (
    <View style={styles.progressHeader}>
      <View style={styles.progressRow}>
        <View style={styles.xpBarTrack}>
          <View style={[styles.xpBarFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.xpLabel}>{xpEarned} XP</Text>
      </View>
      {streakCount > 0 && (
        <View style={[styles.streakBadge, isHot && styles.streakBadgeHot]}>
          <Text style={styles.streakText}>{isHot ? '🔥' : '✦'} {streakCount}x streak</Text>
        </View>
      )}
    </View>
  );
}

export function NearMissBanner() {
  const { isNearMiss, nearMissMessage } = useDeepLearning();
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isNearMiss) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 500, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 500, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isNearMiss, glow]);

  if (!isNearMiss || !nearMissMessage) return null;

  const borderColor = glow.interpolate({ inputRange: [0, 1], outputRange: [DL_COLORS.amethystSoft, DL_COLORS.amethyst] });

  return (
    <Animated.View style={[styles.nearMissBanner, { borderColor }]}>
      <Text style={styles.nearMissText}>💡 {nearMissMessage}</Text>
    </Animated.View>
  );
}

export function StageCompleteBanner({
  visible,
  isFinalStage,
  onContinue,
}: {
  visible: boolean;
  isFinalStage: boolean;
  /** Advances to the next stage, or — on the final stage — restarts the module with fresh numbers. */
  onContinue: () => void;
}) {
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slide, { toValue: visible ? 1 : 0, useNativeDriver: true, friction: 7 }).start();
  }, [visible, slide]);

  if (!visible) return null;

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });

  return (
    <Animated.View style={[styles.completeBanner, { opacity: slide, transform: [{ translateY }] }]}>
      <Text style={styles.completeEmoji}>{isFinalStage ? '🏆' : '⚡'}</Text>
      <Text style={styles.completeTitle}>{isFinalStage ? 'Module Mastered!' : 'Stage Cleared!'}</Text>
      <Pressable
        style={styles.continueButton}
        onPress={onContinue}
        accessibilityRole="button"
        accessibilityLabel={isFinalStage ? 'Play again' : 'Continue to next stage'}
      >
        <Text style={styles.continueButtonText}>{isFinalStage ? 'Play Again ↻' : 'Continue ➔'}</Text>
      </Pressable>
    </Animated.View>
  );
}

function GameInner({ maxXp, realmId, onRestart }: { maxXp: number; realmId?: string; onRestart: () => void }) {
  const { stages, activeStageIndex, activeStage, unlockedStages, submitInput, goToStage, lastResult, xpEarned } = useDeepLearning();
  const [showBanner, setShowBanner] = useState(false);
  const prevXpRef = useRef(0);

  const isFinalStage = activeStageIndex === stages.length - 1;

  useEffect(() => {
    if (lastResult !== 'won') return;
    setShowBanner(true);

    // Mirror this module's own XP economy into the app-wide Hero character —
    // each module keeps running its local engine unchanged; this just feeds
    // the delta since last win into the global level/title system.
    const delta = xpEarned - prevXpRef.current;
    if (delta > 0) {
      awardXP(delta);
      prevXpRef.current = xpEarned;
    }
    if (isFinalStage && realmId) markRealmCleared(realmId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastResult, activeStageIndex]);

  function handleContinue() {
    setShowBanner(false);
    if (!isFinalStage) {
      goToStage(activeStageIndex + 1);
    } else {
      onRestart();
    }
  }

  const StageCanvas = activeStage.renderCanvas;

  return (
    <View style={styles.gameContainer}>
      <ProgressHeader maxXp={maxXp} />
      <LevelSelector stages={stages} activeStageIndex={activeStageIndex} unlockedStages={unlockedStages} onSelectStage={goToStage} />
      <Text style={styles.stageTitle}>{activeStage.title}</Text>
      <NearMissBanner />
      {!showBanner && (
        <StageCanvas
          value={0}
          onChangeValue={() => {}}
          onCommit={submitInput}
          target={activeStage.targetValue}
          tolerance={activeStage.toleranceThreshold}
          isNearMiss={false}
          nearMissMessage={null}
          isActive
        />
      )}
      <StageCompleteBanner visible={showBanner} isFinalStage={isFinalStage} onContinue={handleContinue} />
    </View>
  );
}

/** Drop-in 4-stage game screen: hand it a module's stage configs and it wires up the whole shell. */
export function DeepLearningGameScreen({
  stages,
  maxXp,
  realmId,
  onRestart,
}: {
  stages: MathStageConfig[];
  maxXp: number;
  /** Module key (e.g. 'arithmetic') used to mark this realm cleared in the global Hero state on mastery. */
  realmId?: string;
  /** Called when the player taps "Play Again" after mastering the final stage — the caller should regenerate fresh random content and remount this tree (e.g. via a changing `key`). */
  onRestart?: () => void;
}) {
  return (
    <DeepLearningProvider stages={stages}>
      <View style={styles.root}>
        <GameInner maxXp={maxXp} realmId={realmId} onRestart={onRestart ?? (() => {})} />
      </View>
    </DeepLearningProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: DL_COLORS.bgDeep,
  },
  gameContainer: {
    padding: 14,
    paddingBottom: 32,
  },
  progressHeader: {
    marginBottom: 4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  xpBarTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: DL_COLORS.surfaceMuted,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: DL_COLORS.lime,
    shadowColor: DL_COLORS.lime,
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },
  xpLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: DL_COLORS.lime,
    minWidth: 58,
    textAlign: 'right',
  },
  streakBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: DL_COLORS.surfaceMuted,
  },
  streakBadgeHot: {
    backgroundColor: DL_COLORS.limeSoft,
    shadowColor: DL_COLORS.lime,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '800',
    color: DL_COLORS.lime,
  },
  stageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DL_COLORS.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  nearMissBanner: {
    borderWidth: 2,
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    backgroundColor: DL_COLORS.surface,
  },
  nearMissText: {
    color: DL_COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  completeBanner: {
    backgroundColor: DL_COLORS.limeSoft,
    borderWidth: 2,
    borderColor: DL_COLORS.lime,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    shadowColor: DL_COLORS.lime,
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  completeEmoji: {
    fontSize: 44,
  },
  completeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: DL_COLORS.lime,
  },
  continueButton: {
    backgroundColor: DL_COLORS.lime,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 10,
    marginTop: 4,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: DL_COLORS.bgDeep,
  },
});
