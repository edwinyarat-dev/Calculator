import * as Haptics from 'expo-haptics';
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { MathStageConfig } from './types';

const STREAK_BONUS_THRESHOLD = 3;
const STREAK_MULTIPLIER = 1.5;
const CRIT_MULTIPLIER = 1.25;
const DEFAULT_FAST_CLEAR_MS = 20000;
/** Fraction of a stage's baseXp granted, once, the first time a near-miss happens on it — a real partial reward for "close enough to show understanding," not just an empty encouragement message. */
const NEAR_MISS_XP_FRACTION = 0.15;

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
  /** True when the most recent win also cleared the stage inside its `fastClearMs` window — a "Swift Clear" bonus, not a per-question reflex check (stages only report once, on their final round). */
  wasCrit: boolean;
  /** Running totals for this playthrough, surfaced in the realm-completion summary. */
  totalAttempts: number;
  totalCorrect: number;
  totalNearMisses: number;
  bestStreakEver: number;
  /** Unique `stage.skill` values touched so far, in the order first encountered. */
  skillsPracticed: string[];
  /** Formally evaluates an attempt against the active stage. Returns true on a win. */
  submitInput: (value: number) => boolean;
  /** Jump to an already-unlocked stage (from the LevelSelector). */
  goToStage: (index: number) => void;
  clearNearMiss: () => void;
}

const DeepLearningContext = createContext<DeepLearningContextValue | null>(null);

function triggerHaptic(kind: 'success' | 'warning' | 'error') {
  if (Platform.OS === 'web') return;
  const type =
    kind === 'success'
      ? Haptics.NotificationFeedbackType.Success
      : kind === 'warning'
        ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Error;
  Haptics.notificationAsync(type).catch(() => {
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
  const [wasCrit, setWasCrit] = useState(false);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalNearMisses, setTotalNearMisses] = useState(0);
  const [bestStreakEver, setBestStreakEver] = useState(0);
  const [skillsPracticed, setSkillsPracticed] = useState<string[]>([]);

  const stageStartRef = useRef(Date.now());
  const nearMissXpAwardedRef = useRef<Set<string>>(new Set());

  const activeStage = stages[activeStageIndex];

  const submitInput = useCallback(
    (value: number) => {
      const stage = stages[activeStageIndex];
      if (!stage) return false;

      const won = stage.checkWinCondition(value, stage.targetValue, stage.toleranceThreshold);
      setTotalAttempts((n) => n + 1);

      if (stage.skill) {
        setSkillsPracticed((prev) => (prev.includes(stage.skill!) ? prev : [...prev, stage.skill!]));
      }

      if (won) {
        const elapsedMs = Date.now() - stageStartRef.current;
        const crit = elapsedMs <= (stage.fastClearMs ?? DEFAULT_FAST_CLEAR_MS);
        const nextStreak = streakCount + 1;
        const streakMultiplier = nextStreak >= STREAK_BONUS_THRESHOLD ? STREAK_MULTIPLIER : 1;
        const critMultiplier = crit ? CRIT_MULTIPLIER : 1;
        const xpGain = Math.round(stage.baseXp * streakMultiplier * critMultiplier);

        setStreakCount(nextStreak);
        setBestStreakEver((b) => Math.max(b, nextStreak));
        setXpEarned((xp) => xp + xpGain);
        setTotalCorrect((n) => n + 1);
        setIsNearMiss(false);
        setNearMissMessage(null);
        setLastResult('won');
        setWasCrit(crit);
        setResultToken((t) => t + 1);

        const nextStage = stages[activeStageIndex + 1];
        if (nextStage) {
          setUnlockedStages((prev) => (prev.includes(nextStage.id) ? prev : [...prev, nextStage.id]));
        }

        triggerHaptic('success');
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
        setTotalNearMisses((n) => n + 1);
        // A real, bounded partial reward — once per stage, so it can't be farmed
        // by deliberately grazing the threshold on every attempt.
        if (!nearMissXpAwardedRef.current.has(stage.id)) {
          nearMissXpAwardedRef.current.add(stage.id);
          const partialXp = Math.round(stage.baseXp * NEAR_MISS_XP_FRACTION);
          setXpEarned((xp) => xp + partialXp);
        }
        triggerHaptic('warning');
      } else {
        setIsNearMiss(false);
        setNearMissMessage(null);
        setStreakCount(0);
        triggerHaptic('error');
      }
      setWasCrit(false);
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
        stageStartRef.current = Date.now();
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
      wasCrit,
      totalAttempts,
      totalCorrect,
      totalNearMisses,
      bestStreakEver,
      skillsPracticed,
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
      wasCrit,
      totalAttempts,
      totalCorrect,
      totalNearMisses,
      bestStreakEver,
      skillsPracticed,
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
