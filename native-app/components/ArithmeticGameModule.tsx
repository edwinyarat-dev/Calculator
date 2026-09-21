import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ReAnimated from 'react-native-reanimated';
import { AnswerBlocks } from '../src/features/deep-learning/AnswerBlocks';
import { useDeepLearning } from '../src/features/deep-learning/DeepLearningContext';
import { DeepLearningGameScreen } from '../src/features/deep-learning/GameChrome';
import { HintExplanationPanel } from '../src/features/deep-learning/HintExplanationPanel';
import type { Difficulty, PerformanceTracker } from '../src/features/deep-learning/mathUtils';
import { pickByDifficulty, randomInt, scoreAgainst, shuffle, usePerformanceTracker } from '../src/features/deep-learning/mathUtils';
import { DL_COLORS } from '../src/features/deep-learning/theme';
import type { MathProblem, MathStageConfig, StageCanvasProps } from '../src/features/deep-learning/types';
import { ParticleBurst, useSuccessEffects } from '../src/features/deep-learning/useSuccessEffects';

// ---------------------------------------------------------------------------
// Number Ninja — place value, construction, comparison, and multi-step number
// reasoning. Every question is a real MathProblem (question/answer/hint/
// explanation) drawn from a difficulty-tiered pool via the shared
// usePerformanceTracker/pickByDifficulty utilities (mathUtils.ts), so the
// realm adapts to the player instead of just re-rolling the same range.
// ---------------------------------------------------------------------------

const PLACE_NAMES = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands'];

function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

function digitAt(n: number, place: number): number {
  return Math.floor(n / 10 ** place) % 10;
}

function placeValueOf(n: number, place: number): number {
  return digitAt(n, place) * 10 ** place;
}

/** A number with exactly this many digits (no leading zero). */
function randomNumberWithDigits(digits: number): number {
  const min = 10 ** (digits - 1);
  const max = 10 ** digits - 1;
  return randomInt(min, max);
}

function difficultyToDigits(difficulty: Difficulty): number {
  return difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
}

/** A round to show: the teaching-shaped problem plus the tappable option set (always includes the answer). */
interface Round {
  problem: MathProblem<number>;
  options: number[];
}

function digitDistractors(correctDigit: number, count: number): number[] {
  const pool = shuffle(Array.from({ length: 10 }, (_, i) => i).filter((d) => d !== correctDigit));
  return pool.slice(0, count);
}

function nearbyNumberDistractors(answer: number, count: number, spread: number): number[] {
  const candidates = new Set<number>();
  const add = (v: number) => {
    if (v >= 0 && v !== answer) candidates.add(v);
  };
  let guard = 0;
  while (candidates.size < count && guard < 40) {
    guard++;
    const offset = randomInt(1, spread) * (Math.random() < 0.5 ? -1 : 1);
    add(answer + offset);
  }
  return shuffle([...candidates]).slice(0, count);
}

// ---------------------------------------------------------------------------
// Stage 1 — Digit Detective: identify digits & place value
// ---------------------------------------------------------------------------

function makeDigitPlaceValueRound(difficulty: Difficulty): Round {
  const digits = difficultyToDigits(difficulty);
  const n = randomNumberWithDigits(digits);
  const maxPlace = Math.min(digits - 1, difficulty === 'easy' ? 2 : digits - 1);
  const place = randomInt(0, maxPlace);
  const askValue = place > 0 && Math.random() < 0.5;
  const digit = digitAt(n, place);
  const value = placeValueOf(n, place);
  const answer = askValue ? value : digit;

  const problem: MathProblem<number> = {
    id: `s1-${n}-${place}-${askValue}`,
    question: askValue
      ? `In ${fmt(n)}, what is the value of the digit in the ${PLACE_NAMES[place]} place?`
      : `What digit is in the ${PLACE_NAMES[place]} place of ${fmt(n)}?`,
    answer,
    difficulty,
    skill: 'place value',
    hint: askValue
      ? `Take the digit in that place and multiply it by ${fmt(10 ** place)}.`
      : `Count place columns from the right: ones, tens, hundreds, thousands...`,
    explanation: askValue
      ? `The ${PLACE_NAMES[place]} digit in ${fmt(n)} is ${digit}, so its value is ${digit} × ${fmt(10 ** place)} = ${fmt(value)}.`
      : `Counting place columns from the right, the ${PLACE_NAMES[place]} place of ${fmt(n)} holds the digit ${digit}.`,
  };

  const options = askValue
    ? shuffle([answer, ...nearbyNumberDistractors(answer, 5, Math.max(10, value))])
    : shuffle([answer, ...digitDistractors(answer, 5)]);

  return { problem, options };
}

const STAGE1_POOLS: Record<Difficulty, (() => Round)[]> = {
  easy: [() => makeDigitPlaceValueRound('easy')],
  medium: [() => makeDigitPlaceValueRound('medium')],
  hard: [() => makeDigitPlaceValueRound('hard')],
};

// ---------------------------------------------------------------------------
// Stage 2 — Number Builder: construct a number from its expanded (place
// value) form
// ---------------------------------------------------------------------------

function makeConstructRound(difficulty: Difficulty): Round {
  const digits = difficultyToDigits(difficulty);
  const n = randomNumberWithDigits(digits);
  const parts: string[] = [];
  for (let p = digits - 1; p >= 0; p--) {
    const v = placeValueOf(n, p);
    if (v > 0) parts.push(fmt(v));
  }
  const expandedForm = parts.join(' + ');

  const problem: MathProblem<number> = {
    id: `s2-${n}`,
    question: `Which number equals ${expandedForm}?`,
    answer: n,
    difficulty,
    skill: 'constructing numbers from place value',
    hint: 'Line up each part by its own place value, then add them together.',
    explanation: `${expandedForm} = ${fmt(n)}.`,
  };

  // Distractors built from a real construction mistake — swapping two
  // adjacent place-value digits — topped up with nearby numbers so a sparse
  // digit string never leaves too few options.
  const digitsStr = n.toString().padStart(digits, '0').split('');
  const swapped = new Set<number>();
  for (let i = 0; i < digitsStr.length - 1; i++) {
    const copy = [...digitsStr];
    [copy[i], copy[i + 1]] = [copy[i + 1], copy[i]];
    const value = parseInt(copy.join(''), 10);
    if (value !== n) swapped.add(value);
  }
  const distractors = new Set<number>([...swapped, ...nearbyNumberDistractors(n, 5, 10 ** Math.max(1, digits - 2))]);
  const options = shuffle([n, ...shuffle([...distractors]).slice(0, 5)]);

  return { problem, options };
}

const STAGE2_POOLS: Record<Difficulty, (() => Round)[]> = {
  easy: [() => makeConstructRound('easy')],
  medium: [() => makeConstructRound('medium')],
  hard: [() => makeConstructRound('hard')],
};

// ---------------------------------------------------------------------------
// Stage 3 — Compare & Order
// ---------------------------------------------------------------------------

function makeCompareRound(difficulty: Difficulty): Round {
  const digits = difficultyToDigits(difficulty);
  const a = randomNumberWithDigits(digits);
  let b = randomNumberWithDigits(digits);
  while (b === a) b = randomNumberWithDigits(digits);
  const askGreater = Math.random() < 0.5;
  const answer = askGreater ? Math.max(a, b) : Math.min(a, b);

  // Find the highest place where the two numbers actually differ, for an
  // explanation that teaches the comparison method, not just the result.
  let diffPlace = digits - 1;
  for (let p = digits - 1; p >= 0; p--) {
    if (digitAt(a, p) !== digitAt(b, p)) {
      diffPlace = p;
      break;
    }
  }

  const problem: MathProblem<number> = {
    id: `s3cmp-${a}-${b}-${askGreater}`,
    question: `Which number is ${askGreater ? 'greater' : 'smaller'}: ${fmt(a)} or ${fmt(b)}?`,
    answer,
    difficulty,
    skill: 'comparing and ordering numbers',
    hint: 'Compare digits starting from the leftmost place — the first place that differs decides it.',
    explanation: `Reading from the left, the ${PLACE_NAMES[diffPlace]} place is the first one that differs (${digitAt(a, diffPlace)} vs ${digitAt(b, diffPlace)}), so ${fmt(Math.max(a, b))} is greater than ${fmt(Math.min(a, b))}.`,
  };

  return { problem, options: shuffle([a, b]) };
}

function makeOrderRound(difficulty: Difficulty): Round {
  const digits = difficultyToDigits(difficulty);
  const nums = new Set<number>();
  while (nums.size < 3) nums.add(randomNumberWithDigits(digits));
  const arr = shuffle([...nums]);
  const sorted = [...arr].sort((x, y) => x - y);
  const mode = randomInt(0, 2);
  const answer = sorted[mode];
  const label = mode === 0 ? 'smallest' : mode === 1 ? 'middle' : 'largest';

  const problem: MathProblem<number> = {
    id: `s3ord-${arr.join('-')}-${mode}`,
    question: `Which of these numbers is the ${label} one: ${arr.map(fmt).join(', ')}?`,
    answer,
    difficulty,
    skill: 'comparing and ordering numbers',
    hint: 'Line the numbers up by their leading digit first, then work rightward if there is a tie.',
    explanation: `In order from least to greatest: ${sorted.map(fmt).join(' < ')}. The ${label} value is ${fmt(answer)}.`,
  };

  return { problem, options: arr };
}

const STAGE3_POOLS: Record<Difficulty, (() => Round)[]> = {
  easy: [() => makeCompareRound('easy'), () => makeOrderRound('easy')],
  medium: [() => makeCompareRound('medium'), () => makeOrderRound('medium')],
  hard: [() => makeCompareRound('hard'), () => makeOrderRound('hard')],
};

// ---------------------------------------------------------------------------
// Stage 4 — Multi-step number challenge (boss): sustain accuracy over a
// stream of two-step place-value + arithmetic problems
// ---------------------------------------------------------------------------

const STAGE4_MIN_ATTEMPTS = 8;
const STAGE4_TARGET_PERCENT = 90;

function makeMultiStepRound(difficulty: Difficulty): Round {
  const digits = difficultyToDigits(difficulty);
  const n = randomNumberWithDigits(digits);
  const template = randomInt(0, 1);

  if (template === 0) {
    // Identify two digits' places, sum them, scale by 10.
    const p1 = randomInt(0, digits - 1);
    let p2 = randomInt(0, digits - 1);
    while (p2 === p1) p2 = randomInt(0, digits - 1);
    const d1 = digitAt(n, p1);
    const d2 = digitAt(n, p2);
    const answer = (d1 + d2) * 10;
    const problem: MathProblem<number> = {
      id: `s4a-${n}-${p1}-${p2}`,
      question: `In ${fmt(n)}, add the digit in the ${PLACE_NAMES[p1]} place to the digit in the ${PLACE_NAMES[p2]} place, then multiply the sum by 10. What do you get?`,
      answer,
      difficulty,
      skill: 'multi-step number reasoning',
      hint: `First find each digit, add them, then multiply by 10.`,
      explanation: `The ${PLACE_NAMES[p1]} digit is ${d1} and the ${PLACE_NAMES[p2]} digit is ${d2}. (${d1} + ${d2}) × 10 = ${fmt(answer)}.`,
    };
    return { problem, options: shuffle([answer, ...nearbyNumberDistractors(answer, 5, 30)]) };
  }

  // Construct a number from place-value pieces, then double it and subtract a round amount.
  const subtractAmount = 10 ** Math.max(1, digits - 2) * randomInt(1, 5);
  const built = digitAt(n, 0) + digitAt(n, 1) * 10 + (digits > 2 ? digitAt(n, 2) * 100 : 0);
  const answer = built * 2 - subtractAmount;
  const problem: MathProblem<number> = {
    id: `s4b-${n}-${subtractAmount}`,
    question: `A number has ${digitAt(n, 2) || 0} hundreds, ${digitAt(n, 1)} tens, and ${digitAt(n, 0)} ones. Double that number, then subtract ${fmt(subtractAmount)}. What is the result?`,
    answer: Math.max(0, answer),
    difficulty,
    skill: 'multi-step number reasoning',
    hint: 'Build the number first, then double it, then subtract.',
    explanation: `The number is ${fmt(built)}. Doubled: ${fmt(built * 2)}. Minus ${fmt(subtractAmount)} = ${fmt(Math.max(0, answer))}.`,
  };
  return { problem, options: shuffle([Math.max(0, answer), ...nearbyNumberDistractors(Math.max(0, answer), 5, 50)]) };
}

const STAGE4_POOLS: Record<Difficulty, (() => Round)[]> = {
  easy: [() => makeMultiStepRound('easy')],
  medium: [() => makeMultiStepRound('medium')],
  hard: [() => makeMultiStepRound('hard')],
};

// ---------------------------------------------------------------------------
// Shared 3-round stage canvas: identical shape for stages 1–3, only the pool
// and copy differ.
// ---------------------------------------------------------------------------

function useAdaptiveRound(pools: Record<Difficulty, (() => Round)[]>, tracker: PerformanceTracker, resetKey: unknown): Round {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => pickByDifficulty(pools, tracker.difficulty)(), [resetKey]);
}

function ThreeRoundStage({
  totalRounds,
  pools,
  progressLabel,
  onCommit,
  isActive,
}: {
  totalRounds: number;
  pools: Record<Difficulty, (() => Round)[]>;
  progressLabel: string;
} & StageCanvasProps) {
  const tracker = usePerformanceTracker({ floor: 'easy', ceiling: 'hard' });
  const { isNearMiss } = useDeepLearning();
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const effects = useSuccessEffects();
  const current = useAdaptiveRound(pools, tracker, round);
  const isFinalRound = round === totalRounds - 1;

  useEffect(() => {
    tracker.startTimer();
    setSelected(null);
    setFeedback('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  function handleSelect(value: number) {
    if (!isActive || feedback !== 'idle') return;
    setSelected(value);
    const correct = value === current.problem.answer;
    setFeedback(correct ? 'correct' : 'wrong');
    tracker.recordAttempt({ correct });

    if (correct) {
      effects.trigger();
      if (isFinalRound) {
        onCommit(1);
      } else {
        setTimeout(() => setRound((r) => r + 1), 650);
      }
    } else {
      if (isFinalRound) onCommit(scoreAgainst(value, current.problem.answer));
      setTimeout(() => {
        if (!isFinalRound) setRound((r) => r + 1);
        setSelected(null);
        setFeedback('idle');
      }, 1500);
    }
  }

  const showNearMiss = isFinalRound && feedback === 'wrong' && isNearMiss;

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>
        {progressLabel} {round + 1} of {totalRounds}
      </Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <Text style={styles.promptText}>{current.problem.question}</Text>
        {effects.isBursting && (
          <View style={styles.burstOverlay} pointerEvents="none">
            <ParticleBurst progress={effects.burstProgress} />
          </View>
        )}
      </ReAnimated.View>
      <AnswerBlocks
        options={current.options}
        selected={selected}
        correctValue={current.problem.answer}
        feedback={feedback}
        onSelect={handleSelect}
      />
      <HintExplanationPanel
        hint={current.problem.hint}
        explanation={feedback !== 'idle' ? current.problem.explanation : null}
        feedback={feedback === 'idle' ? 'idle' : feedback === 'correct' ? 'correct' : showNearMiss ? 'nearMiss' : 'wrong'}
        onUseHint={tracker.recordHintUsed}
        disabled={feedback !== 'idle'}
      />
    </View>
  );
}

function Stage1DigitDetective(props: StageCanvasProps) {
  return <ThreeRoundStage totalRounds={3} pools={STAGE1_POOLS} progressLabel="Round" {...props} />;
}

function Stage2NumberBuilder(props: StageCanvasProps) {
  return <ThreeRoundStage totalRounds={3} pools={STAGE2_POOLS} progressLabel="Round" {...props} />;
}

function Stage3CompareOrder(props: StageCanvasProps) {
  return <ThreeRoundStage totalRounds={3} pools={STAGE3_POOLS} progressLabel="Round" {...props} />;
}

function Stage4MultiStepBoss({ onCommit, isActive }: StageCanvasProps) {
  const tracker = usePerformanceTracker({ floor: 'easy', ceiling: 'hard' });
  const [attempts, setAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [roundKey, setRoundKey] = useState(0);
  const wonRef = useRef(false);
  const effects = useSuccessEffects();
  const current = useAdaptiveRound(STAGE4_POOLS, tracker, roundKey);

  useEffect(() => {
    tracker.startTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundKey]);

  const accuracyPercent = attempts === 0 ? 100 : (correctCount / attempts) * 100;

  function nextRound() {
    setRoundKey((k) => k + 1);
    setSelected(null);
    setFeedback('idle');
  }

  function handleSelect(value: number) {
    if (!isActive || feedback !== 'idle' || wonRef.current) return;
    setSelected(value);
    const correct = value === current.problem.answer;
    const nextAttempts = attempts + 1;
    const nextCorrect = correctCount + (correct ? 1 : 0);
    setAttempts(nextAttempts);
    setCorrectCount(nextCorrect);
    setFeedback(correct ? 'correct' : 'wrong');
    tracker.recordAttempt({ correct });

    const percent = (nextCorrect / nextAttempts) * 100;
    if (correct) effects.trigger();
    // Like every other stage, this only reports to the engine once — on the
    // actual win — never on an interim miss; the boss keeps cycling fresh
    // problems locally until the accuracy bar is cleared, so failure here
    // can never permanently block progression, only slow it down.
    if (correct && nextAttempts >= STAGE4_MIN_ATTEMPTS && percent >= STAGE4_TARGET_PERCENT) {
      wonRef.current = true;
      onCommit(percent);
      return;
    }
    setTimeout(nextRound, 1500);
  }

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>
        Boss level: multi-step number reasoning — {STAGE4_TARGET_PERCENT}% accuracy over {STAGE4_MIN_ATTEMPTS}+ problems
      </Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <Text style={styles.promptText}>{current.problem.question}</Text>
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

      <AnswerBlocks
        options={current.options}
        selected={selected}
        correctValue={current.problem.answer}
        feedback={feedback}
        onSelect={handleSelect}
      />
      <HintExplanationPanel
        hint={current.problem.hint}
        explanation={feedback !== 'idle' ? current.problem.explanation : null}
        feedback={feedback}
        onUseHint={tracker.recordHintUsed}
        disabled={feedback !== 'idle'}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage config + top-level module
// ---------------------------------------------------------------------------

function buildArithmeticStages(): MathStageConfig[] {
  return [
    {
      id: 'digit-detective',
      title: 'Digit Detective',
      objective: 'Identify digits and their place value.',
      targetValue: 1,
      baseXp: 20,
      toleranceThreshold: 0,
      nearMiss: { thresholdPercent: 15, message: 'So close — double-check which place column that is!' },
      checkWinCondition: (value, target) => value >= target,
      renderCanvas: Stage1DigitDetective,
      skill: 'place value',
      fastClearMs: 15000,
    },
    {
      id: 'number-builder',
      title: 'Number Builder',
      objective: 'Construct numbers from their place-value parts.',
      targetValue: 1,
      baseXp: 40,
      toleranceThreshold: 0,
      nearMiss: { thresholdPercent: 12, message: 'Right idea, just a place got mixed up — try again.' },
      checkWinCondition: (value, target) => value >= target,
      renderCanvas: Stage2NumberBuilder,
      skill: 'constructing numbers from place value',
      fastClearMs: 20000,
    },
    {
      id: 'compare-order',
      title: 'Compare & Order',
      objective: 'Compare and order multi-digit numbers.',
      targetValue: 1,
      baseXp: 60,
      toleranceThreshold: 0,
      nearMiss: { thresholdPercent: 10, message: 'Those two were close in size — look at the leading digits again.' },
      checkWinCondition: (value, target) => value >= target,
      renderCanvas: Stage3CompareOrder,
      skill: 'comparing and ordering numbers',
      fastClearMs: 22000,
    },
    {
      id: 'multi-step-mastery',
      title: 'Multi-Step Mastery',
      objective: 'Boss: two-step place-value and arithmetic reasoning.',
      targetValue: STAGE4_TARGET_PERCENT,
      baseXp: 100,
      toleranceThreshold: 0,
      checkWinCondition: (value, target) => value >= target,
      renderCanvas: Stage4MultiStepBoss,
      skill: 'multi-step number reasoning',
      fastClearMs: 45000,
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
    fontSize: 20,
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
