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
}
