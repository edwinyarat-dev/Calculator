import React, { useEffect, useRef, useState } from 'react';
import Slider from '@react-native-community/slider';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReAnimated from 'react-native-reanimated';
import { DeepLearningGameScreen } from '../src/features/deep-learning/GameChrome';
import { EntryDisplay, NumericKeypad } from '../src/features/deep-learning/NumericKeypad';
import { DL_COLORS } from '../src/features/deep-learning/theme';
import type { MathStageConfig, StageCanvasProps } from '../src/features/deep-learning/types';
import { ParticleBurst, useSuccessEffects } from '../src/features/deep-learning/useSuccessEffects';

function compoundAmount(principal: number, ratePct: number, years: number): number {
  return principal * Math.pow(1 + ratePct / 100, years);
}

function fmtMoney(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US');
}

// ---------------------------------------------------------------------------
// Stage 1 — Foundations: "Piggy Bank Basics", one year of interest
// ---------------------------------------------------------------------------

const STAGE1_PROBLEMS = [
  { principal: 100, ratePct: 10 },
  { principal: 200, ratePct: 5 },
  { principal: 50, ratePct: 20 },
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
  const answer = Math.round(compoundAmount(problem.principal, problem.ratePct, 1));

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
      <Text style={styles.stageObjective}>Round {round + 1} of {STAGE1_PROBLEMS.length} · a piggy bank that pays interest</Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <EntryDisplay
          prompt={`You put $${problem.principal} in a savings account paying ${problem.ratePct}% a year. After 1 year, how much do you have?`}
          entry={entry}
          feedback={feedback}
          prefix="$"
        />
        {effects.isBursting && (
          <View style={styles.burstOverlay} pointerEvents="none">
            <ParticleBurst progress={effects.burstProgress} />
          </View>
        )}
      </ReAnimated.View>
      <NumericKeypad onDigit={pressDigit} onBackspace={backspace} onSubmit={submit} disabled={feedback !== 'idle'} />
      <Text style={styles.stageHint}>Add the interest on top of what you started with.</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage 2 — Quantitative Mechanics: "Multi-Year Growth", the real formula
// ---------------------------------------------------------------------------

const STAGE2_PROBLEMS = [
  { principal: 100, ratePct: 10, years: 2 },
  { principal: 200, ratePct: 10, years: 2 },
  { principal: 100, ratePct: 20, years: 2 },
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
  const answer = Math.round(compoundAmount(problem.principal, problem.ratePct, problem.years));

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
      <Text style={styles.stageObjective}>Round {round + 1} of {STAGE2_PROBLEMS.length} · the balance compounds every year</Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <EntryDisplay
          prompt={`$${problem.principal} at ${problem.ratePct}% a year, left alone for ${problem.years} years. What's the balance?`}
          entry={entry}
          feedback={feedback}
          prefix="$"
        />
        {effects.isBursting && (
          <View style={styles.burstOverlay} pointerEvents="none">
            <ParticleBurst progress={effects.burstProgress} />
          </View>
        )}
      </ReAnimated.View>
      <NumericKeypad onDigit={pressDigit} onBackspace={backspace} onSubmit={submit} disabled={feedback !== 'idle'} />
      <Text style={styles.stageHint}>Year 2 grows from Year 1's balance — not the original amount.</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage 3 — Variables Challenge: "Rate Rush", catch a good rate before it drifts
// ---------------------------------------------------------------------------

const STAGE3_RATE_CYCLE = [2, 5, 8, 12, 15, 3, 18, 6];
const STAGE3_TICK_MS = 650;
const STAGE3_PRINCIPAL = 100;
const STAGE3_YEARS = 10;
const STAGE3_ROUNDS = [
  { savingFor: 'a new bike', target: 150 },
  { savingFor: 'a laptop', target: 250 },
  { savingFor: 'a car down payment', target: 400 },
];

function Stage3RateRush({ onCommit, isActive }: StageCanvasProps) {
  const [round, setRound] = useState(0);
  const [tickIndex, setTickIndex] = useState(0);
  const [flash, setFlash] = useState<'idle' | 'good' | 'bad'>('idle');
  const finalRoundWonRef = useRef(false);
  const effects = useSuccessEffects();

  const isFinalRound = round === STAGE3_ROUNDS.length - 1;
  const goal = STAGE3_ROUNDS[round];
  const currentRate = STAGE3_RATE_CYCLE[tickIndex];
  const projected = compoundAmount(STAGE3_PRINCIPAL, currentRate, STAGE3_YEARS);
  const qualifies = projected >= goal.target;

  useEffect(() => {
    finalRoundWonRef.current = false;
    setFlash('idle');
  }, [round]);

  // The rate clock always keeps ticking, independent of the button's feedback
  // flash — otherwise every press (even a losing one) would freeze the rate
  // in place until the flash cleared, defeating the "catch it in time" idea.
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => setTickIndex((i) => (i + 1) % STAGE3_RATE_CYCLE.length), STAGE3_TICK_MS);
    return () => clearInterval(id);
  }, [isActive]);

  function lockIn() {
    if (!isActive || flash !== 'idle') return;
    if (qualifies) {
      setFlash('good');
      effects.trigger();
      if (isFinalRound) {
        finalRoundWonRef.current = true;
        onCommit(projected);
      } else {
        setTimeout(() => setRound((r) => r + 1), 500);
      }
    } else {
      setFlash('bad');
      if (isFinalRound) onCommit(projected);
      setTimeout(() => setFlash('idle'), 450);
    }
  }

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>
        Round {round + 1} of {STAGE3_ROUNDS.length} · saving for {goal.savingFor} — need ${goal.target}+ after {STAGE3_YEARS} years
      </Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <View style={styles.rateDisplay}>
          <Text style={styles.rateLabel}>Current rate</Text>
          <Text style={[styles.rateValue, { color: qualifies ? DL_COLORS.lime : DL_COLORS.amethyst }]}>{currentRate}%</Text>
          <Text style={styles.projectedLabel}>Projected balance ({STAGE3_YEARS}y): {fmtMoney(projected)}</Text>
        </View>
        {effects.isBursting && (
          <View style={styles.burstOverlay} pointerEvents="none">
            <ParticleBurst progress={effects.burstProgress} />
          </View>
        )}
      </ReAnimated.View>
      <Pressable
        onPress={lockIn}
        disabled={flash !== 'idle'}
        accessibilityRole="button"
        accessibilityLabel="Lock in this rate"
        style={[styles.lockButton, flash === 'good' && styles.lockButtonGood, flash === 'bad' && styles.lockButtonBad]}
      >
        <Text style={styles.lockButtonText}>
          {flash === 'good' ? '✓ Locked in!' : flash === 'bad' ? '✗ Not quite enough' : 'LOCK IN THIS RATE'}
        </Text>
      </Pressable>
      <Text style={styles.stageHint}>The rate on offer keeps changing — a higher rate compounds into a much bigger balance over {STAGE3_YEARS} years.</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage 4 — Mastery Sandbox: "Retirement Planner Boss"
// ---------------------------------------------------------------------------

const STAGE4_TARGET = 1000;
const STAGE4_MATCH_THRESHOLD = 95;

function computeMatchPercent(principal: number, ratePct: number, years: number): number {
  const amount = compoundAmount(principal, ratePct, years);
  const diffPercent = (Math.abs(amount - STAGE4_TARGET) / STAGE4_TARGET) * 100;
  return Math.max(0, 100 - diffPercent);
}

function Stage4MasterySandbox({ onCommit, isActive }: StageCanvasProps) {
  const [principal, setPrincipal] = useState(300);
  const [ratePct, setRatePct] = useState(4);
  const [years, setYears] = useState(5);
  const effects = useSuccessEffects();
  const wonRef = useRef(false);

  const finalAmount = compoundAmount(principal, ratePct, years);
  const matchPercent = computeMatchPercent(principal, ratePct, years);

  useEffect(() => {
    if (!isActive || wonRef.current) return;
    if (matchPercent >= STAGE4_MATCH_THRESHOLD) {
      wonRef.current = true;
      effects.trigger();
      onCommit(matchPercent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchPercent, isActive]);

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>Boss level: plan a ${STAGE4_TARGET} goal — tune every variable to land within {STAGE4_MATCH_THRESHOLD}% of it.</Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <Text style={styles.finalAmountLabel}>Projected final balance</Text>
        <Text style={[styles.finalAmountValue, { color: matchPercent >= STAGE4_MATCH_THRESHOLD ? DL_COLORS.lime : DL_COLORS.amethyst }]}>
          {fmtMoney(finalAmount)}
        </Text>
        <Text style={styles.stageHint}>Target: {fmtMoney(STAGE4_TARGET)}</Text>
      </ReAnimated.View>

      <View style={styles.matchRow}>
        <Text style={styles.stageHint}>Match: </Text>
        <Text style={[styles.matchValue, { color: matchPercent >= STAGE4_MATCH_THRESHOLD ? DL_COLORS.lime : DL_COLORS.amethyst }]}>
          {matchPercent.toFixed(1)}%
        </Text>
      </View>

      <Text style={styles.sliderLabel}>Starting deposit: {fmtMoney(principal)}</Text>
      <Slider style={styles.slider} minimumValue={100} maximumValue={800} step={10} value={principal} onValueChange={setPrincipal} minimumTrackTintColor={DL_COLORS.amethyst} maximumTrackTintColor={DL_COLORS.surfaceMuted} thumbTintColor={DL_COLORS.amethyst} />

      <Text style={styles.sliderLabel}>Annual rate: {ratePct.toFixed(1)}%</Text>
      <Slider style={styles.slider} minimumValue={1} maximumValue={15} step={0.5} value={ratePct} onValueChange={setRatePct} minimumTrackTintColor={DL_COLORS.amethyst} maximumTrackTintColor={DL_COLORS.surfaceMuted} thumbTintColor={DL_COLORS.amethyst} />

      <Text style={styles.sliderLabel}>Years invested: {years}</Text>
      <Slider style={styles.slider} minimumValue={1} maximumValue={20} step={1} value={years} onValueChange={setYears} minimumTrackTintColor={DL_COLORS.amethyst} maximumTrackTintColor={DL_COLORS.surfaceMuted} thumbTintColor={DL_COLORS.amethyst} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage config + top-level module
// ---------------------------------------------------------------------------

const MONEY_GROWER_STAGES: MathStageConfig[] = [
  {
    id: 'foundations',
    title: 'Foundations',
    objective: 'One year of simple growth — principal plus interest.',
    targetValue: Math.round(
      compoundAmount(STAGE1_PROBLEMS[STAGE1_PROBLEMS.length - 1].principal, STAGE1_PROBLEMS[STAGE1_PROBLEMS.length - 1].ratePct, 1)
    ),
    baseXp: 20,
    toleranceThreshold: 0,
    nearMiss: { thresholdPercent: STAGE1_NEAR_MISS_PERCENT, message: "So close — remember, it's the starting amount PLUS the interest." },
    checkWinCondition: (value, target) => value === target,
    renderCanvas: Stage1Foundations,
  },
  {
    id: 'quantitative',
    title: 'Quantitative Mechanics',
    objective: 'Multiple years — each year compounds on the last.',
    targetValue: Math.round(
      compoundAmount(
        STAGE2_PROBLEMS[STAGE2_PROBLEMS.length - 1].principal,
        STAGE2_PROBLEMS[STAGE2_PROBLEMS.length - 1].ratePct,
        STAGE2_PROBLEMS[STAGE2_PROBLEMS.length - 1].years
      )
    ),
    baseXp: 40,
    toleranceThreshold: 0,
    nearMiss: { thresholdPercent: STAGE2_NEAR_MISS_PERCENT, message: 'Right idea — double-check you compounded the second year too.' },
    checkWinCondition: (value, target) => value === target,
    renderCanvas: Stage2QuantitativeMechanics,
  },
  {
    id: 'variables',
    title: 'Rate Rush',
    objective: 'Catch a rate high enough to hit your savings goal.',
    targetValue: STAGE3_ROUNDS[STAGE3_ROUNDS.length - 1].target,
    baseXp: 60,
    toleranceThreshold: 0,
    nearMiss: { thresholdPercent: 15, message: 'So close — that rate almost got you there over 10 years.' },
    checkWinCondition: (value, target) => value >= target,
    renderCanvas: Stage3RateRush,
  },
  {
    id: 'mastery',
    title: 'Mastery Sandbox',
    objective: 'Tune principal, rate, and time to hit a real savings goal.',
    targetValue: STAGE4_MATCH_THRESHOLD,
    baseXp: 100,
    toleranceThreshold: 0,
    checkWinCondition: (value, target) => value >= target,
    renderCanvas: Stage4MasterySandbox,
  },
];

export default function MoneyGrowerGameModule() {
  return <DeepLearningGameScreen stages={MONEY_GROWER_STAGES} maxXp={220} realmId="compoundInterest" />;
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
  rateDisplay: {
    alignItems: 'center',
    gap: 6,
  },
  rateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: DL_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rateValue: {
    fontSize: 40,
    fontWeight: '800',
  },
  projectedLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: DL_COLORS.text,
    marginTop: 4,
  },
  lockButton: {
    backgroundColor: DL_COLORS.surfaceMuted,
    borderWidth: 2,
    borderColor: DL_COLORS.amethyst,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  lockButtonGood: {
    backgroundColor: DL_COLORS.limeSoft,
    borderColor: DL_COLORS.lime,
  },
  lockButtonBad: {
    backgroundColor: 'rgba(255, 92, 92, 0.16)',
    borderColor: '#FF5C5C',
  },
  lockButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: DL_COLORS.text,
  },
  finalAmountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: DL_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  finalAmountValue: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 4,
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
  sliderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: DL_COLORS.textMuted,
  },
  slider: {
    width: '100%',
    height: 36,
  },
});
