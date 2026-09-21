import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ReAnimated from 'react-native-reanimated';
import { AnswerBlocks } from '../src/features/deep-learning/AnswerBlocks';
import { DeepLearningGameScreen } from '../src/features/deep-learning/GameChrome';
import { DL_COLORS } from '../src/features/deep-learning/theme';
import type { MathStageConfig, StageCanvasProps } from '../src/features/deep-learning/types';
import { ParticleBurst, useSuccessEffects } from '../src/features/deep-learning/useSuccessEffects';

type OpSymbol = '+' | '−' | '×';

function compute(a: number, b: number, op: OpSymbol): number {
  switch (op) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
  }
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * How close a wrong final-round answer was, as a 0–1 score (1 = exact).
 * Every stage in this module reports this normalized score to the engine
 * instead of the raw typed value — the engine's win/near-miss check is then
 * a fixed "score >= 1" regardless of what the randomly-generated correct
 * answer happens to be each playthrough, so regenerating fresh problems on
 * restart can never desync from the win condition.
 */
function scoreAgainst(typed: number, answer: number): number {
  return Math.max(0, 1 - Math.abs(typed - answer) / Math.max(1, Math.abs(answer)));
}

/**
 * Builds the tappable answer options for an a/b/op problem: the real answer
 * plus a few distractors built from common real mistakes for that operator
 * (adding instead of subtracting, off-by-one on an operand, a place-value
 * slip, …), topped up with small random near-misses if there aren't enough
 * natural candidates. Forces the player to actually evaluate each option
 * rather than pattern-match a lone number, which is the point of swapping
 * the keypad for blocks.
 */
function generateOpOptions(a: number, b: number, op: OpSymbol, count = 4): number[] {
  const answer = compute(a, b, op);
  const candidates = new Set<number>();
  const add = (value: number) => {
    if (value >= 0 && value !== answer) candidates.add(value);
  };

  if (op === '+') {
    add(Math.abs(a - b)); // mistakenly subtracted
    add(answer + 10);
    add(answer - 10);
  } else if (op === '−') {
    add(a + b); // mistakenly added
    add(Math.abs(b - a) === answer ? answer + 1 : Math.abs(b - a)); // reversed the operands
  } else {
    add(a + b); // mistakenly added
    add(a * (b + 1)); // off-by-one on one operand
    add((a + 1) * b);
  }

  let guard = 0;
  while (candidates.size < count - 1 && guard < 30) {
    guard++;
    const offset = randomInt(1, 6) * (Math.random() < 0.5 ? -1 : 1);
    add(answer + offset);
  }

  const distractors = shuffle([...candidates]).slice(0, count - 1);
  return shuffle([answer, ...distractors]);
}

// ---------------------------------------------------------------------------
// Stage 1 — Foundations: single-step sums, answered by tapping a wooden block
// ---------------------------------------------------------------------------

function generateStage1Problems(): { a: number; b: number; op: OpSymbol }[] {
  return Array.from({ length: 3 }, () => {
    if (Math.random() < 0.5) {
      return { a: randomInt(1, 9), b: randomInt(1, 9), op: '+' as const };
    }
    const a = randomInt(10, 18);
    return { a, b: randomInt(1, a - 1), op: '−' as const };
  });
}

function Stage1Foundations({ onCommit, isActive }: StageCanvasProps) {
  const [problems] = useState(generateStage1Problems);
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const finalRoundWonRef = useRef(false);
  const effects = useSuccessEffects();

  const isFinalRound = round === problems.length - 1;
  const problem = problems[round];
  const answer = compute(problem.a, problem.b, problem.op);
  const options = useMemo(() => generateOpOptions(problem.a, problem.b, problem.op), [round]);

  useEffect(() => {
    finalRoundWonRef.current = false;
    setSelected(null);
    setFeedback('idle');
  }, [round]);

  function handleSelect(value: number) {
    if (!isActive || feedback !== 'idle') return;
    setSelected(value);
    if (value === answer) {
      setFeedback('correct');
      effects.trigger();
      if (isFinalRound) {
        finalRoundWonRef.current = true;
        onCommit(1);
      } else {
        setTimeout(() => setRound((r) => r + 1), 500);
      }
    } else {
      setFeedback('wrong');
      if (isFinalRound) onCommit(scoreAgainst(value, answer));
      setTimeout(() => {
        setSelected(null);
        setFeedback('idle');
      }, 700);
    }
  }

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>Round {round + 1} of {problems.length}</Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <Text style={styles.promptText}>{problem.a} {problem.op} {problem.b} = ?</Text>
        {effects.isBursting && (
          <View style={styles.burstOverlay} pointerEvents="none">
            <ParticleBurst progress={effects.burstProgress} />
          </View>
        )}
      </ReAnimated.View>
      <AnswerBlocks options={options} selected={selected} correctValue={answer} feedback={feedback} onSelect={handleSelect} />
      <Text style={styles.stageHint}>Tap the wooden block with the right answer.</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage 2 — Quantitative Mechanics: two-digit combos across all operators
// ---------------------------------------------------------------------------

function generateStage2Problems(): { a: number; b: number; op: OpSymbol }[] {
  return Array.from({ length: 3 }, () => {
    const r = Math.random();
    if (r < 0.4) return { a: randomInt(20, 70), b: randomInt(10, 40), op: '+' as const };
    if (r < 0.8) {
      const a = randomInt(30, 90);
      return { a, b: randomInt(10, a - 5), op: '−' as const };
    }
    return { a: randomInt(3, 9), b: randomInt(3, 9), op: '×' as const };
  });
}

function Stage2QuantitativeMechanics({ onCommit, isActive }: StageCanvasProps) {
  const [problems] = useState(generateStage2Problems);
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const finalRoundWonRef = useRef(false);
  const effects = useSuccessEffects();

  const isFinalRound = round === problems.length - 1;
  const problem = problems[round];
  const answer = compute(problem.a, problem.b, problem.op);
  const options = useMemo(() => generateOpOptions(problem.a, problem.b, problem.op), [round]);

  useEffect(() => {
    finalRoundWonRef.current = false;
    setSelected(null);
    setFeedback('idle');
  }, [round]);

  function handleSelect(value: number) {
    if (!isActive || feedback !== 'idle') return;
    setSelected(value);
    if (value === answer) {
      setFeedback('correct');
      effects.trigger();
      if (isFinalRound) {
        finalRoundWonRef.current = true;
        onCommit(1);
      } else {
        setTimeout(() => setRound((r) => r + 1), 500);
      }
    } else {
      setFeedback('wrong');
      if (isFinalRound) onCommit(scoreAgainst(value, answer));
      setTimeout(() => {
        setSelected(null);
        setFeedback('idle');
      }, 700);
    }
  }

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>Round {round + 1} of {problems.length} · bigger numbers, every operator</Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <Text style={styles.promptText}>{problem.a} {problem.op} {problem.b} = ?</Text>
        {effects.isBursting && (
          <View style={styles.burstOverlay} pointerEvents="none">
            <ParticleBurst progress={effects.burstProgress} />
          </View>
        )}
      </ReAnimated.View>
      <AnswerBlocks options={options} selected={selected} correctValue={answer} feedback={feedback} onSelect={handleSelect} />
      <Text style={styles.stageHint}>Same idea, tougher numbers — check each block before you commit.</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage 3 — Variables Challenge: beat the clock, 5 correct in a row
// ---------------------------------------------------------------------------

const STAGE3_TIME_MS = 8000;
const STAGE3_STREAK_TARGET = 5;
const STAGE3_TICK_MS = 50;

function randomStage3Problem(): { a: number; b: number; op: OpSymbol } {
  const op: OpSymbol = Math.random() < 0.5 ? '+' : '−';
  if (op === '+') {
    return { a: Math.floor(Math.random() * 40) + 1, b: Math.floor(Math.random() * 40) + 1, op };
  }
  const a = Math.floor(Math.random() * 40) + 10;
  const b = Math.floor(Math.random() * a) + 1;
  return { a, b, op };
}

function Stage3VariablesChallenge({ onCommit, isActive }: StageCanvasProps) {
  const [problem, setProblem] = useState(randomStage3Problem);
  const [selected, setSelected] = useState<number | null>(null);
  const [comboStreak, setComboStreak] = useState(0);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [timeLeftMs, setTimeLeftMs] = useState(STAGE3_TIME_MS);
  const deadlineRef = useRef(Date.now() + STAGE3_TIME_MS);
  const wonRef = useRef(false);
  const effects = useSuccessEffects();

  const answer = compute(problem.a, problem.b, problem.op);
  const options = useMemo(() => generateOpOptions(problem.a, problem.b, problem.op), [problem]);

  function nextProblem() {
    setProblem(randomStage3Problem());
    setSelected(null);
    setFeedback('idle');
    deadlineRef.current = Date.now() + STAGE3_TIME_MS;
    setTimeLeftMs(STAGE3_TIME_MS);
  }

  // The clock drains on its own — missing the deadline breaks the combo just like a wrong answer.
  useEffect(() => {
    if (!isActive || wonRef.current) return;
    const id = setInterval(() => {
      const remaining = deadlineRef.current - Date.now();
      if (remaining <= 0) {
        setComboStreak(0);
        setFeedback('wrong');
        setTimeout(nextProblem, 400);
        return;
      }
      setTimeLeftMs(remaining);
    }, STAGE3_TICK_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, problem]);

  function handleSelect(value: number) {
    if (!isActive || feedback !== 'idle') return;
    setSelected(value);
    if (value === answer) {
      const nextCombo = comboStreak + 1;
      setFeedback('correct');
      if (nextCombo >= STAGE3_STREAK_TARGET) {
        wonRef.current = true;
        effects.trigger();
        onCommit(1);
      } else {
        setComboStreak(nextCombo);
        setTimeout(nextProblem, 250);
      }
    } else {
      setComboStreak(0);
      setFeedback('wrong');
      setTimeout(nextProblem, 500);
    }
  }

  const timePct = Math.max(0, timeLeftMs / STAGE3_TIME_MS);
  const timeColor = timePct > 0.5 ? DL_COLORS.lime : timePct > 0.2 ? DL_COLORS.amethyst : '#FF5C5C';

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>Combo {comboStreak} of {STAGE3_STREAK_TARGET} — answer before time runs out</Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <View style={styles.clockTrack}>
          <View style={[styles.clockFill, { width: `${timePct * 100}%`, backgroundColor: timeColor }]} />
        </View>
        <Text style={styles.promptText}>{problem.a} {problem.op} {problem.b} = ?</Text>
        {effects.isBursting && (
          <View style={styles.burstOverlay} pointerEvents="none">
            <ParticleBurst progress={effects.burstProgress} />
          </View>
        )}
      </ReAnimated.View>
      <AnswerBlocks options={options} selected={selected} correctValue={answer} feedback={feedback} onSelect={handleSelect} />
      <Text style={styles.stageHint}>A miss or a timeout resets your combo — get {STAGE3_STREAK_TARGET} straight to clear the stage.</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage 4 — Mastery Sandbox: order-of-operations boss, 95% accuracy to win
// ---------------------------------------------------------------------------

const STAGE4_MIN_ATTEMPTS = 10;
const STAGE4_TARGET_PERCENT = 95;

interface Stage4Problem {
  text: string;
  answer: number;
  /** The result a player gets by ignoring the parentheses (or evaluating
   * strictly left-to-right) — the single most common real mistake for this
   * kind of expression, so it makes a genuinely thought-provoking distractor. */
  misconception: number;
}

const STAGE4_PROBLEMS: Stage4Problem[] = [
  { text: '(3 + 5) × 2', answer: 16, misconception: 13 },
  { text: '10 − (2 × 3)', answer: 4, misconception: 24 },
  { text: '4 × (6 − 2)', answer: 16, misconception: 22 },
  { text: '(12 − 4) ÷ 2', answer: 4, misconception: 10 },
  { text: '9 + (3 × 4)', answer: 21, misconception: 48 },
  { text: '(18 ÷ 3) + 5', answer: 11, misconception: 59 },
  { text: '2 × (5 + 3) − 4', answer: 12, misconception: 9 },
  { text: '(7 + 2) − (2 × 3)', answer: 3, misconception: 21 },
];

function randomStage4Problem(lastText?: string): Stage4Problem {
  let p = STAGE4_PROBLEMS[Math.floor(Math.random() * STAGE4_PROBLEMS.length)];
  if (STAGE4_PROBLEMS.length > 1) {
    while (p.text === lastText) {
      p = STAGE4_PROBLEMS[Math.floor(Math.random() * STAGE4_PROBLEMS.length)];
    }
  }
  return p;
}

function generateStage4Options(problem: Stage4Problem, count = 4): number[] {
  const candidates = new Set<number>();
  const add = (value: number) => {
    if (value >= 0 && value !== problem.answer) candidates.add(value);
  };
  add(problem.misconception);

  let guard = 0;
  while (candidates.size < count - 1 && guard < 30) {
    guard++;
    const offset = randomInt(1, 5) * (Math.random() < 0.5 ? -1 : 1);
    add(problem.answer + offset);
  }

  const distractors = shuffle([...candidates]).slice(0, count - 1);
  return shuffle([problem.answer, ...distractors]);
}

function Stage4MasterySandbox({ onCommit, isActive }: StageCanvasProps) {
  const [problem, setProblem] = useState<Stage4Problem>(() => randomStage4Problem());
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [attempts, setAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const wonRef = useRef(false);
  const effects = useSuccessEffects();

  const accuracyPercent = attempts === 0 ? 100 : (correctCount / attempts) * 100;
  const options = useMemo(() => generateStage4Options(problem), [problem]);

  function nextProblem(currentText: string) {
    setProblem(randomStage4Problem(currentText));
    setSelected(null);
    setFeedback('idle');
  }

  function handleSelect(value: number) {
    if (!isActive || feedback !== 'idle' || wonRef.current) return;
    setSelected(value);
    const correct = value === problem.answer;
    const nextAttempts = attempts + 1;
    const nextCorrect = correctCount + (correct ? 1 : 0);
    setAttempts(nextAttempts);
    setCorrectCount(nextCorrect);
    setFeedback(correct ? 'correct' : 'wrong');

    const percent = (nextCorrect / nextAttempts) * 100;
    if (correct) effects.trigger();
    if (correct && nextAttempts >= STAGE4_MIN_ATTEMPTS && percent >= STAGE4_TARGET_PERCENT) {
      wonRef.current = true;
      onCommit(percent);
      return;
    }
    setTimeout(() => nextProblem(problem.text), 700);
  }

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>Boss level: order of operations — {STAGE4_TARGET_PERCENT}% accuracy over {STAGE4_MIN_ATTEMPTS}+ problems</Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <Text style={styles.promptText}>{problem.text} = ?</Text>
        {effects.isBursting && (
          <View style={styles.burstOverlay} pointerEvents="none">
            <ParticleBurst progress={effects.burstProgress} />
          </View>
        )}
      </ReAnimated.View>

      <View style={styles.matchRow}>
        <Text style={styles.stageHint}>Accuracy: </Text>
        <Text style={[styles.matchValue, { color: accuracyPercent >= STAGE4_TARGET_PERCENT ? DL_COLORS.lime : DL_COLORS.amethyst }]}>
          {accuracyPercent.toFixed(0)}%
        </Text>
        <Text style={styles.stageHint}> · {attempts} answered</Text>
      </View>

      <AnswerBlocks options={options} selected={selected} correctValue={problem.answer} feedback={feedback} onSelect={handleSelect} />
      <Text style={styles.stageHint}>Remember: parentheses first, then multiply/divide, then add/subtract.</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage config + top-level module
// ---------------------------------------------------------------------------

function buildArithmeticStages(): MathStageConfig[] {
  return [
    {
      id: 'foundations',
      title: 'Foundations',
      objective: 'Solve simple one-step sums to build speed.',
      targetValue: 1,
      baseXp: 20,
      toleranceThreshold: 0,
      nearMiss: { thresholdPercent: 15, message: 'So close — double-check that last digit!' },
      checkWinCondition: (value, target) => value >= target,
      renderCanvas: Stage1Foundations,
    },
    {
      id: 'quantitative',
      title: 'Quantitative Mechanics',
      objective: 'Two-digit numbers across every operator.',
      targetValue: 1,
      baseXp: 40,
      toleranceThreshold: 0,
      nearMiss: { thresholdPercent: 10, message: 'Right idea, just a small slip — try that one again.' },
      checkWinCondition: (value, target) => value >= target,
      renderCanvas: Stage2QuantitativeMechanics,
    },
    {
      id: 'variables',
      title: 'The Variables Challenge',
      objective: 'Answer fast, five in a row, before the clock runs out.',
      targetValue: 1,
      baseXp: 60,
      toleranceThreshold: 0.001,
      checkWinCondition: (value, target, tolerance) => Math.abs(value - target) <= tolerance,
      renderCanvas: Stage3VariablesChallenge,
    },
    {
      id: 'mastery',
      title: 'Mastery Sandbox',
      objective: 'Order-of-operations boss — sustain 95% accuracy.',
      targetValue: STAGE4_TARGET_PERCENT,
      baseXp: 100,
      toleranceThreshold: 0,
      checkWinCondition: (value, target) => value >= target,
      renderCanvas: Stage4MasterySandbox,
    },
  ];
}

export default function ArithmeticGameModule() {
  const [playthrough, setPlaythrough] = useState(0);
  const stages = React.useMemo(buildArithmeticStages, [playthrough]);
  return (
    <DeepLearningGameScreen
      key={playthrough}
      stages={stages}
      maxXp={220}
      realmId="arithmetic"
      onRestart={() => setPlaythrough((p) => p + 1)}
    />
  );
}

const styles = StyleSheet.create({
  stageBody: {
    gap: 10,
  },
  stageObjective: {
    fontSize: 13,
    fontWeight: '700',
    color: DL_COLORS.textMuted,
    textAlign: 'center',
  },
  canvasCard: {
    backgroundColor: DL_COLORS.surface,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: DL_COLORS.border,
    overflow: 'hidden',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  promptText: {
    fontSize: 26,
    fontWeight: '800',
    color: DL_COLORS.text,
    textAlign: 'center',
  },
  burstOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  clockTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: DL_COLORS.surfaceMuted,
    overflow: 'hidden',
    marginBottom: 14,
  },
  clockFill: {
    height: '100%',
    borderRadius: 999,
  },
  stageHint: {
    fontSize: 12.5,
    color: DL_COLORS.textMuted,
    textAlign: 'center',
  },
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
  },
  matchValue: {
    fontSize: 16,
    fontWeight: '800',
  },
});
