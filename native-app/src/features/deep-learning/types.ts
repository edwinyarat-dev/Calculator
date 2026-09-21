import type { ComponentType } from 'react';

/** How close a wrong answer must be to the target to count as an encouraging "near miss" rather than a plain fail. */
export interface NearMissConfig {
  /** Error tolerated, as a percentage of the target's magnitude. */
  thresholdPercent: number;
  /** Micro-copy shown when a near miss is detected. */
  message: string;
}

/** Props every stage's canvas component receives from the engine. */
export interface StageCanvasProps {
  /** The student's current/live value for whatever this stage is tuning (angle, sine, etc). */
  value: number;
  /** Update the live value as the student interacts (drag, type, etc). */
  onChangeValue: (value: number) => void;
  /** Call once the student's attempt should be formally evaluated (e.g. a hold-duration completed, or a slider was released). */
  onCommit: (value: number) => void;
  target: number;
  tolerance: number;
  isNearMiss: boolean;
  nearMissMessage: string | null;
  isActive: boolean;
}

/**
 * A single generated question a stage is asking right now. Stages that use
 * `pickDifficulty`/hints build these internally (see `mathUtils.ts`) — this
 * type doesn't replace each stage's own bespoke problem shape (an angle, a
 * dataset, an expression, …), it standardizes the *teaching* fields on top
 * of whatever stage-specific fields a module already has, so a shared
 * `HintExplanationPanel` can render any of them the same way.
 */
export interface MathProblem<TAnswer = number> {
  id: string;
  question: string;
  answer: TAnswer;
  acceptableAnswers?: TAnswer[];
  difficulty: 'easy' | 'medium' | 'hard';
  /** The concept this question actually exercises, e.g. "place value" or "compound interest". Shown in the realm-completion summary's "skills practiced" list. */
  skill: string;
  hint?: string;
  /** Shown after answering (right or wrong) — the "why", not just the "what". */
  explanation: string;
}

/** A single stage's configuration — the data any math module hands the deep-learning engine. */
export interface MathStageConfig {
  id: string;
  title: string;
  objective: string;
  targetValue: number;
  baseXp: number;
  toleranceThreshold: number;
  nearMiss?: NearMissConfig;
  checkWinCondition: (value: number, target: number, tolerance: number) => boolean;
  renderCanvas: ComponentType<StageCanvasProps>;
  /** The concept this stage exercises overall (falls back to per-problem `skill` when set) — surfaced in the realm-completion summary. */
  skill?: string;
  /** Clearing the whole stage faster than this earns a "Swift Clear" XP bonus. Measured from when the stage becomes active to when it's won, since stages only report a result once, on their final round — see ARCHITECTURE.md. */
  fastClearMs?: number;
}
