import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReAnimated from 'react-native-reanimated';
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

// ---------------------------------------------------------------------------
// Shared numeric keypad — every stage answers by typing digits, not dragging.
// ---------------------------------------------------------------------------

interface NumericKeypadProps {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}

function NumericKeypad({ onDigit, onBackspace, onSubmit, disabled }: NumericKeypadProps) {
  const rows = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
  ];
  return (
    <View style={styles.keypad}>
      {rows.map((row, i) => (
        <View key={i} style={styles.keypadRow}>
          {row.map((d) => (
            <Pressable
              key={d}
              disabled={disabled}
              onPress={() => onDigit(d)}
              style={styles.keypadKey}
              accessibilityRole="button"
              accessibilityLabel={`Digit ${d}`}
            >
              <Text style={styles.keypadKeyText}>{d}</Text>
            </Pressable>
          ))}
        </View>
      ))}
      <View style={styles.keypadRow}>
        <Pressable
          disabled={disabled}
          onPress={onBackspace}
          style={styles.keypadKeyMuted}
          accessibilityRole="button"
          accessibilityLabel="Backspace"
        >
          <Text style={styles.keypadKeyMutedText}>⌫</Text>
        </Pressable>
        <Pressable
          disabled={disabled}
          onPress={() => onDigit('0')}
          style={styles.keypadKey}
          accessibilityRole="button"
          accessibilityLabel="Digit 0"
        >
          <Text style={styles.keypadKeyText}>0</Text>
        </Pressable>
        <Pressable
          disabled={disabled}
          onPress={onSubmit}
          style={styles.keypadKeySubmit}
          accessibilityRole="button"
          accessibilityLabel="Check answer"
        >
          <Text style={styles.keypadKeySubmitText}>✓</Text>
        </Pressable>
      </View>
    </View>
  );
}

function EntryDisplay({ prompt, entry, feedback }: { prompt: string; entry: string; feedback: 'idle' | 'correct' | 'wrong' }) {
  return (
    <View style={styles.entryCard}>
      <Text style={styles.promptText}>{prompt}</Text>
      <View
        style={[
          styles.entryBox,
          feedback === 'correct' && styles.entryBoxCorrect,
          feedback === 'wrong' && styles.entryBoxWrong,
        ]}
      >
        <Text style={styles.entryText}>{entry || '?'}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage 1 — Foundations: single-step sums, answered by typed digit
// ---------------------------------------------------------------------------

const STAGE1_PROBLEMS: { a: number; b: number; op: OpSymbol }[] = [
  { a: 4, b: 3, op: '+' },
  { a: 9, b: 6, op: '+' },
  { a: 15, b: 7, op: '−' },
];
const STAGE1_NEAR_MISS_PERCENT = 15;

function Stage1Foundations({ onCommit, isActive }: StageCanvasProps) {
  const [round, setRound] = useState(0);
  const [entry, setEntry] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const finalRoundWonRef = useRef(false);
  const effects = useSuccessEffects();

  const isFinalRound = round === STAGE1_PROBLEMS.length - 1;
  const problem = STAGE1_PROBLEMS[round];
  const answer = compute(problem.a, problem.b, problem.op);

  useEffect(() => {
    finalRoundWonRef.current = false;
    setEntry('');
    setFeedback('idle');
  }, [round]);

  function pressDigit(d: string) {
    if (!isActive || entry.length >= 3) return;
    setEntry((e) => e + d);
  }
  function backspace() {
    if (!isActive) return;
    setEntry((e) => e.slice(0, -1));
  }

  function submit() {
    if (!isActive || entry === '') return;
    const value = Number(entry);
    if (value === answer) {
      setFeedback('correct');
      effects.trigger();
      if (isFinalRound) {
        finalRoundWonRef.current = true;
        onCommit(value);
      } else {
        setRound((r) => r + 1);
      }
    } else {
      setFeedback('wrong');
      if (isFinalRound) onCommit(value);
      setTimeout(() => {
        setEntry('');
        setFeedback('idle');
      }, 500);
    }
  }

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>Round {round + 1} of {STAGE1_PROBLEMS.length}</Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <EntryDisplay prompt={`${problem.a} ${problem.op} ${problem.b} = ?`} entry={entry} feedback={feedback} />
        {effects.isBursting && (
          <View style={styles.burstOverlay} pointerEvents="none">
            <ParticleBurst progress={effects.burstProgress} />
          </View>
        )}
      </ReAnimated.View>
      <NumericKeypad onDigit={pressDigit} onBackspace={backspace} onSubmit={submit} disabled={feedback !== 'idle'} />
      <Text style={styles.stageHint}>Type the answer, then tap ✓ to check it.</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage 2 — Quantitative Mechanics: two-digit combos across all operators
// ---------------------------------------------------------------------------

const STAGE2_PROBLEMS: { a: number; b: number; op: OpSymbol }[] = [
  { a: 34, b: 19, op: '+' },
  { a: 61, b: 27, op: '−' },
  { a: 8, b: 7, op: '×' },
];
const STAGE2_NEAR_MISS_PERCENT = 10;

function Stage2QuantitativeMechanics({ onCommit, isActive }: StageCanvasProps) {
  const [round, setRound] = useState(0);
  const [entry, setEntry] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const finalRoundWonRef = useRef(false);
  const effects = useSuccessEffects();

  const isFinalRound = round === STAGE2_PROBLEMS.length - 1;
  const problem = STAGE2_PROBLEMS[round];
  const answer = compute(problem.a, problem.b, problem.op);

  useEffect(() => {
    finalRoundWonRef.current = false;
    setEntry('');
    setFeedback('idle');
  }, [round]);

  function pressDigit(d: string) {
    if (!isActive || entry.length >= 4) return;
    setEntry((e) => e + d);
  }
  function backspace() {
    if (!isActive) return;
    setEntry((e) => e.slice(0, -1));
  }

  function submit() {
    if (!isActive || entry === '') return;
    const value = Number(entry);
    if (value === answer) {
      setFeedback('correct');
      effects.trigger();
      if (isFinalRound) {
        finalRoundWonRef.current = true;
        onCommit(value);
      } else {
        setRound((r) => r + 1);
      }
    } else {
      setFeedback('wrong');
      if (isFinalRound) onCommit(value);
      setTimeout(() => {
        setEntry('');
        setFeedback('idle');
      }, 500);
    }
  }

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>Round {round + 1} of {STAGE2_PROBLEMS.length} · bigger numbers, every operator</Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <EntryDisplay prompt={`${problem.a} ${problem.op} ${problem.b} = ?`} entry={entry} feedback={feedback} />
        {effects.isBursting && (
          <View style={styles.burstOverlay} pointerEvents="none">
            <ParticleBurst progress={effects.burstProgress} />
          </View>
        )}
      </ReAnimated.View>
      <NumericKeypad onDigit={pressDigit} onBackspace={backspace} onSubmit={submit} disabled={feedback !== 'idle'} />
      <Text style={styles.stageHint}>Same idea, tougher numbers — watch your order of digits.</Text>
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
  const [entry, setEntry] = useState('');
  const [comboStreak, setComboStreak] = useState(0);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [timeLeftMs, setTimeLeftMs] = useState(STAGE3_TIME_MS);
  const deadlineRef = useRef(Date.now() + STAGE3_TIME_MS);
  const wonRef = useRef(false);
  const effects = useSuccessEffects();

  const answer = compute(problem.a, problem.b, problem.op);

  function nextProblem() {
    setProblem(randomStage3Problem());
    setEntry('');
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

  function pressDigit(d: string) {
    if (!isActive || feedback !== 'idle' || entry.length >= 3) return;
    setEntry((e) => e + d);
  }
  function backspace() {
    if (!isActive || feedback !== 'idle') return;
    setEntry((e) => e.slice(0, -1));
  }

  function submit() {
    if (!isActive || feedback !== 'idle' || entry === '') return;
    const value = Number(entry);
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
      setTimeout(nextProblem, 400);
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
        <EntryDisplay prompt={`${problem.a} ${problem.op} ${problem.b} = ?`} entry={entry} feedback={feedback} />
        {effects.isBursting && (
          <View style={styles.burstOverlay} pointerEvents="none">
            <ParticleBurst progress={effects.burstProgress} />
          </View>
        )}
      </ReAnimated.View>
      <NumericKeypad onDigit={pressDigit} onBackspace={backspace} onSubmit={submit} disabled={feedback !== 'idle'} />
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
}

const STAGE4_PROBLEMS: Stage4Problem[] = [
  { text: '(3 + 5) × 2', answer: 16 },
  { text: '10 − (2 × 3)', answer: 4 },
  { text: '4 × (6 − 2)', answer: 16 },
  { text: '(12 − 4) ÷ 2', answer: 4 },
  { text: '9 + (3 × 4)', answer: 21 },
  { text: '(18 ÷ 3) + 5', answer: 11 },
  { text: '2 × (5 + 3) − 4', answer: 12 },
  { text: '(7 + 2) − (2 × 3)', answer: 3 },
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

function Stage4MasterySandbox({ onCommit, isActive }: StageCanvasProps) {
  const [problem, setProblem] = useState<Stage4Problem>(() => randomStage4Problem());
  const [entry, setEntry] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [attempts, setAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const wonRef = useRef(false);
  const effects = useSuccessEffects();

  const accuracyPercent = attempts === 0 ? 100 : (correctCount / attempts) * 100;

  function nextProblem(currentText: string) {
    setProblem(randomStage4Problem(currentText));
    setEntry('');
    setFeedback('idle');
  }

  function pressDigit(d: string) {
    if (!isActive || feedback !== 'idle' || entry.length >= 4) return;
    setEntry((e) => e + d);
  }
  function backspace() {
    if (!isActive || feedback !== 'idle') return;
    setEntry((e) => e.slice(0, -1));
  }

  function submit() {
    if (!isActive || feedback !== 'idle' || entry === '' || wonRef.current) return;
    const value = Number(entry);
    const correct = value === problem.answer;
    const nextAttempts = attempts + 1;
    const nextCorrect = correctCount + (correct ? 1 : 0);
    setAttempts(nextAttempts);
    setCorrectCount(nextCorrect);
    setFeedback(correct ? 'correct' : 'wrong');

    const percent = (nextCorrect / nextAttempts) * 100;
    if (correct && nextAttempts >= STAGE4_MIN_ATTEMPTS && percent >= STAGE4_TARGET_PERCENT) {
      wonRef.current = true;
      effects.trigger();
      onCommit(percent);
      return;
    }
    setTimeout(() => nextProblem(problem.text), 500);
  }

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>Boss level: order of operations — {STAGE4_TARGET_PERCENT}% accuracy over {STAGE4_MIN_ATTEMPTS}+ problems</Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <EntryDisplay prompt={`${problem.text} = ?`} entry={entry} feedback={feedback} />
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

      <NumericKeypad onDigit={pressDigit} onBackspace={backspace} onSubmit={submit} disabled={feedback !== 'idle'} />
      <Text style={styles.stageHint}>Remember: parentheses first, then multiply/divide, then add/subtract.</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage config + top-level module
// ---------------------------------------------------------------------------

const ARITHMETIC_STAGES: MathStageConfig[] = [
  {
    id: 'foundations',
    title: 'Foundations',
    objective: 'Solve simple one-step sums to build speed.',
    targetValue: compute(
      STAGE1_PROBLEMS[STAGE1_PROBLEMS.length - 1].a,
      STAGE1_PROBLEMS[STAGE1_PROBLEMS.length - 1].b,
      STAGE1_PROBLEMS[STAGE1_PROBLEMS.length - 1].op
    ),
    baseXp: 20,
    toleranceThreshold: 0,
    nearMiss: { thresholdPercent: STAGE1_NEAR_MISS_PERCENT, message: 'So close — double-check that last digit!' },
    checkWinCondition: (value, target) => value === target,
    renderCanvas: Stage1Foundations,
  },
  {
    id: 'quantitative',
    title: 'Quantitative Mechanics',
    objective: 'Two-digit numbers across every operator.',
    targetValue: compute(
      STAGE2_PROBLEMS[STAGE2_PROBLEMS.length - 1].a,
      STAGE2_PROBLEMS[STAGE2_PROBLEMS.length - 1].b,
      STAGE2_PROBLEMS[STAGE2_PROBLEMS.length - 1].op
    ),
    baseXp: 40,
    toleranceThreshold: 0,
    nearMiss: { thresholdPercent: STAGE2_NEAR_MISS_PERCENT, message: 'Right idea, just a small slip — try that one again.' },
    checkWinCondition: (value, target) => value === target,
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

export default function ArithmeticGameModule() {
  return <DeepLearningGameScreen stages={ARITHMETIC_STAGES} maxXp={220} />;
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
  burstOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  entryCard: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  promptText: {
    fontSize: 26,
    fontWeight: '800',
    color: DL_COLORS.text,
    textAlign: 'center',
  },
  entryBox: {
    minWidth: 120,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: DL_COLORS.border,
    backgroundColor: DL_COLORS.surfaceMuted,
    alignItems: 'center',
  },
  entryBoxCorrect: {
    borderColor: DL_COLORS.lime,
    backgroundColor: DL_COLORS.limeSoft,
  },
  entryBoxWrong: {
    borderColor: '#FF5C5C',
    backgroundColor: 'rgba(255, 92, 92, 0.16)',
  },
  entryText: {
    fontSize: 28,
    fontWeight: '800',
    color: DL_COLORS.text,
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
  keypad: {
    width: '100%',
    gap: 8,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 8,
  },
  keypadKey: {
    flex: 1,
    aspectRatio: 1.6,
    borderRadius: 14,
    backgroundColor: DL_COLORS.surface,
    borderWidth: 2,
    borderColor: DL_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadKeyText: {
    fontSize: 20,
    fontWeight: '800',
    color: DL_COLORS.text,
  },
  keypadKeyMuted: {
    flex: 1,
    aspectRatio: 1.6,
    borderRadius: 14,
    backgroundColor: DL_COLORS.surfaceMuted,
    borderWidth: 2,
    borderColor: DL_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadKeyMutedText: {
    fontSize: 18,
    fontWeight: '700',
    color: DL_COLORS.textMuted,
  },
  keypadKeySubmit: {
    flex: 1,
    aspectRatio: 1.6,
    borderRadius: 14,
    backgroundColor: DL_COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadKeySubmitText: {
    fontSize: 20,
    fontWeight: '800',
    color: DL_COLORS.bgDeep,
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
