import { useCallback, useRef, useState } from 'react';

// Shared math/game utilities previously duplicated (byte-for-byte identical
// implementations) across all 6 realm modules — centralized here per the
// "centralize reusable math utilities" / "remove duplicated logic" goals.
// Behavior is unchanged from the versions this replaces.

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function clampScore(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** How close a wrong answer was, as a 0–1 score (1 = exact) — the normalized value every stage reports to `onCommit`. */
export function scoreAgainst(typed: number, answer: number): number {
  return clampScore(1 - Math.abs(typed - answer) / Math.max(1, Math.abs(answer)));
}

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Builds a shuffled multiple-choice set for an arbitrary numeric answer:
 * the real answer plus `count - 1` distinct nearby distractors, offset by a
 * spread proportional to the answer's own magnitude (falls back to a fixed
 * absolute spread for answers near zero, so a $0 or 0% answer still gets a
 * sensible spread of options instead of a cluster of identical zeros).
 * Shared by every stage that swapped its keypad for a tap-to-choose widget
 * (CoinCatch, PuzzlePieces, EvidenceLineup).
 */
export function numericOptions(answer: number, count = 6, relativeSpread = 0.35): number[] {
  const spread = Math.max(count + 2, Math.round(Math.abs(answer) * relativeSpread));
  const candidates = new Set<number>();
  const add = (value: number) => {
    if (value !== answer && !candidates.has(value)) candidates.add(Math.max(0, value));
  };
  let guard = 0;
  while (candidates.size < count - 1 && guard < 60) {
    guard++;
    const offset = randomInt(1, spread) * (Math.random() < 0.5 ? -1 : 1);
    add(answer + offset);
  }
  return shuffle([answer, ...candidates]);
}

export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * Bounded, in-stage adaptive difficulty. Tracks the last few outcomes plus
 * hint usage and picks the next difficulty from them — never lower than
 * `floor` (so a struggling player is never stuck below the stage's own
 * baseline) and never higher than `ceiling`. Resets whenever a new stage
 * mounts (it's a fresh instance per `renderCanvas` call), so it never
 * carries state between stages or across a restart.
 */
export interface PerformanceTracker {
  attempts: number;
  correct: number;
  currentStreak: number;
  bestStreak: number;
  hintsUsed: number;
  nearMisses: number;
  /** Response time (ms) of the most recent attempt, for "fast answer" bonuses. */
  lastResponseMs: number | null;
  difficulty: Difficulty;
  /** Call once per attempt, right after evaluating it. */
  recordAttempt: (result: { correct: boolean; nearMiss?: boolean; responseMs?: number }) => void;
  recordHintUsed: () => void;
  /** Resets the response-time clock — call when a fresh question is shown. */
  startTimer: () => void;
}

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];

export function usePerformanceTracker(options?: { floor?: Difficulty; ceiling?: Difficulty; start?: Difficulty }): PerformanceTracker {
  const floor = options?.floor ?? 'easy';
  const ceiling = options?.ceiling ?? 'hard';
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [nearMisses, setNearMisses] = useState(0);
  const [lastResponseMs, setLastResponseMs] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(options?.start ?? floor);
  const timerRef = useRef<number>(Date.now());

  const startTimer = useCallback(() => {
    timerRef.current = Date.now();
  }, []);

  const recordAttempt = useCallback(
    ({ correct: wasCorrect, nearMiss, responseMs }: { correct: boolean; nearMiss?: boolean; responseMs?: number }) => {
      const elapsed = responseMs ?? Date.now() - timerRef.current;
      setLastResponseMs(elapsed);
      setAttempts((a) => a + 1);
      if (nearMiss) setNearMisses((n) => n + 1);

      const floorIdx = DIFFICULTY_ORDER.indexOf(floor);
      const ceilingIdx = DIFFICULTY_ORDER.indexOf(ceiling);

      if (wasCorrect) {
        setCorrect((c) => c + 1);
        setCurrentStreak((s) => {
          const next = s + 1;
          setBestStreak((b) => Math.max(b, next));
          // Two quick, correct answers in a row steps difficulty up — bounded by ceiling.
          if (next >= 2) {
            setDifficulty((d) => {
              const idx = Math.min(ceilingIdx, DIFFICULTY_ORDER.indexOf(d) + 1);
              return DIFFICULTY_ORDER[idx];
            });
          }
          return next;
        });
      } else {
        setCurrentStreak(0);
        // A miss (near or not) steps difficulty down — bounded by floor, so the
        // player always has a path back to an easier question, never stuck.
        setDifficulty((d) => {
          const idx = Math.max(floorIdx, DIFFICULTY_ORDER.indexOf(d) - 1);
          return DIFFICULTY_ORDER[idx];
        });
      }
    },
    [floor, ceiling]
  );

  const recordHintUsed = useCallback(() => setHintsUsed((h) => h + 1), []);

  return {
    attempts,
    correct,
    currentStreak,
    bestStreak,
    hintsUsed,
    nearMisses,
    lastResponseMs,
    difficulty,
    recordAttempt,
    recordHintUsed,
    startTimer,
  };
}

/** Picks a random item from whichever difficulty-tiered pool the tracker currently points at, falling back to any non-empty tier so a sparse pool never dead-ends the stage. */
export function pickByDifficulty<T>(pools: Record<Difficulty, T[]>, difficulty: Difficulty): T {
  const pool = pools[difficulty].length > 0 ? pools[difficulty] : pools.medium.length > 0 ? pools.medium : pools.easy.length > 0 ? pools.easy : pools.hard;
  return pool[randomInt(0, pool.length - 1)];
}
