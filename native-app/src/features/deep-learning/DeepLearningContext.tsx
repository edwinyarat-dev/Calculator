import * as Haptics from 'expo-haptics';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import type { MathStageConfig } from './types';

const STREAK_BONUS_THRESHOLD = 3;
const STREAK_MULTIPLIER = 1.5;

export interface DeepLearningContextValue {
  stages: MathStageConfig[];
  activeStageIndex: number;
  activeStage: MathStageConfig;
  unlockedStages: string[];
  streakCount: number;
  xpEarned: number;
  isNearMiss: boolean;
  nearMissMessage: string | null;
  /** Set right after submitInput resolves, so consumers can trigger one-shot effects. */
  lastResult: 'won' | 'lost' | null;
  /** Increments on every submitInput call, even if lastResult repeats the same value twice in a row — lets effects (e.g. a hit/miscast animation) re-fire on consecutive identical outcomes. */
  resultToken: number;
  /** Formally evaluates an attempt against the active stage. Returns true on a win. */
  submitInput: (value: number) => boolean;
  /** Jump to an already-unlocked stage (from the LevelSelector). */
  goToStage: (index: number) => void;
  clearNearMiss: () => void;
}

const DeepLearningContext = createContext<DeepLearningContextValue | null>(null);

function triggerHapticSuccess() {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
    // Haptics are a nicety; a missing/unsupported module should never break the lesson.
  });
}

export function DeepLearningProvider({
  stages,
  children,
}: {
  stages: MathStageConfig[];
  children: React.ReactNode;
}) {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [unlockedStages, setUnlockedStages] = useState<string[]>(() => (stages[0] ? [stages[0].id] : []));
  const [streakCount, setStreakCount] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [isNearMiss, setIsNearMiss] = useState(false);
  const [nearMissMessage, setNearMissMessage] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<'won' | 'lost' | null>(null);
  const [resultToken, setResultToken] = useState(0);

  const activeStage = stages[activeStageIndex];

  const submitInput = useCallback(
    (value: number) => {
      const stage = stages[activeStageIndex];
      if (!stage) return false;

      const won = stage.checkWinCondition(value, stage.targetValue, stage.toleranceThreshold);

      if (won) {
        const nextStreak = streakCount + 1;
        const multiplier = nextStreak >= STREAK_BONUS_THRESHOLD ? STREAK_MULTIPLIER : 1;
        const xpGain = Math.round(stage.baseXp * multiplier);

        setStreakCount(nextStreak);
        setXpEarned((xp) => xp + xpGain);
        setIsNearMiss(false);
        setNearMissMessage(null);
        setLastResult('won');
        setResultToken((t) => t + 1);

        const nextStage = stages[activeStageIndex + 1];
        if (nextStage) {
          setUnlockedStages((prev) => (prev.includes(nextStage.id) ? prev : [...prev, nextStage.id]));
        }

        triggerHapticSuccess();
        return true;
      }

      // Not a win — check whether it's close enough to be an encouraging near miss
      // rather than a plain fail. Near misses never reset progress or the streak.
      const range = Math.abs(stage.targetValue) || 1;
      const errorPercent = (Math.abs(value - stage.targetValue) / range) * 100;
      const nearMiss = !!stage.nearMiss && errorPercent <= stage.nearMiss.thresholdPercent;

      if (nearMiss) {
        setIsNearMiss(true);
        setNearMissMessage(stage.nearMiss!.message);
      } else {
        setIsNearMiss(false);
        setNearMissMessage(null);
        setStreakCount(0);
      }
      setLastResult('lost');
      setResultToken((t) => t + 1);
      return false;
    },
    [activeStageIndex, stages, streakCount]
  );

  const goToStage = useCallback(
    (index: number) => {
      const stage = stages[index];
      if (stage && unlockedStages.includes(stage.id)) {
        setActiveStageIndex(index);
        setIsNearMiss(false);
        setNearMissMessage(null);
        setLastResult(null);
      }
    },
    [stages, unlockedStages]
  );

  const clearNearMiss = useCallback(() => {
    setIsNearMiss(false);
    setNearMissMessage(null);
  }, []);

  const value = useMemo<DeepLearningContextValue>(
    () => ({
      stages,
      activeStageIndex,
      activeStage,
      unlockedStages,
      streakCount,
      xpEarned,
      isNearMiss,
      nearMissMessage,
      lastResult,
      resultToken,
      submitInput,
      goToStage,
      clearNearMiss,
    }),
    [
      stages,
      activeStageIndex,
      activeStage,
      unlockedStages,
      streakCount,
      xpEarned,
      isNearMiss,
      nearMissMessage,
      lastResult,
      resultToken,
      submitInput,
      goToStage,
      clearNearMiss,
    ]
  );

  return <DeepLearningContext.Provider value={value}>{children}</DeepLearningContext.Provider>;
}

export function useDeepLearning(): DeepLearningContextValue {
  const ctx = useContext(DeepLearningContext);
  if (!ctx) {
    throw new Error('useDeepLearning must be used within a DeepLearningProvider');
  }
  return ctx;
}
