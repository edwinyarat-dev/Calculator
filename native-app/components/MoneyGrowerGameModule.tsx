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

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** How close a wrong final-round answer was, as a 0–1 score (see clampScore) — reported to the engine instead of the raw typed value so randomizing the problem each playthrough never desyncs the fixed win check. */
function scoreAgainst(typed: number, answer: number): number {
  return clampScore(1 - Math.abs(typed - answer) / Math.max(1, Math.abs(answer)));
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------------------------------------------------------------------------
// Stage 1 — Foundations: "Piggy Bank Basics", one year of interest
// ---------------------------------------------------------------------------

// Retries until principal × rate happens to divide evenly, so the one-year
// growth always lands on a clean whole-dollar answer.
function randomStage1Problem(): { principal: number; ratePct: number } {
  for (let attempt = 0; attempt < 50; attempt++) {
    const principal = randomInt(2, 20) * 10;
    const ratePct = randomInt(1, 6) * 5;
    if ((principal * ratePct) % 100 === 0) return { principal, ratePct };
  }
  return { principal: 100, ratePct: 10 };
}
function generateStage1Problems(): { principal: number; ratePct: number }[] {
  return Array.from({ length: 3 }, randomStage1Problem);
}

function Stage1Foundations({ onCommit, isActive }: StageCanvasProps) {
  const [problems] = useState(generateStage1Problems);
  const [round, setRound] = useState(0);
  const [entry, setEntry] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const finalRoundWonRef = useRef(false);
  const effects = useSuccessEffects();

  const isFinalRound = round === problems.length - 1;
  const problem = problems[round];
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
        onCommit(1);
      } else {
        setRound((r) => r + 1);
      }
    } else {
      setFeedback('wrong');
      if (isFinalRound) onCommit(scoreAgainst(value, answer));
      setTimeout(() => {
        setEntry('');
        setFeedback('idle');
      }, 500);
    }
  }

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>Round {round + 1} of {problems.length} · a piggy bank that pays interest</Text>
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

// Retries until the two-year compound growth happens to land on a whole
// dollar amount, keeping the typed-answer format clean.
function randomStage2Problem(): { principal: number; ratePct: number; years: number } {
  const years = 2;
  for (let attempt = 0; attempt < 80; attempt++) {
    const principal = randomInt(5, 30) * 10;
    const ratePct = randomInt(1, 6) * 5;
    const amount = compoundAmount(principal, ratePct, years);
    if (Math.abs(amount - Math.round(amount)) < 1e-6) return { principal, ratePct, years };
  }
  return { principal: 100, ratePct: 10, years };
}
function generateStage2Problems(): { principal: number; ratePct: number; years: number }[] {
  return Array.from({ length: 3 }, randomStage2Problem);
}

function Stage2QuantitativeMechanics({ onCommit, isActive }: StageCanvasProps) {
  const [problems] = useState(generateStage2Problems);
  const [round, setRound] = useState(0);
  const [entry, setEntry] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const finalRoundWonRef = useRef(false);
  const effects = useSuccessEffects();

  const isFinalRound = round === problems.length - 1;
  const problem = problems[round];
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
        onCommit(1);
      } else {
        setRound((r) => r + 1);
      }
    } else {
      setFeedback('wrong');
      if (isFinalRound) onCommit(scoreAgainst(value, answer));
      setTimeout(() => {
        setEntry('');
        setFeedback('idle');
      }, 500);
    }
  }

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>Round {round + 1} of {problems.length} · the balance compounds every year</Text>
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

const STAGE3_TICK_MS = 650;
const STAGE3_PRINCIPAL = 100;
const STAGE3_YEARS = 10;
const SAVING_GOALS = ['a new bike', 'a laptop', 'a car down payment', 'a dream vacation', 'a gaming console', 'a new phone'];

interface Stage3Round {
  savingFor: string;
  target: number;
}
interface Stage3Setup {
  rateCycle: number[];
  rounds: Stage3Round[];
}

// Builds a fresh rate cycle and three escalating savings goals every
// playthrough. Round targets are derived directly from percentiles of what
// the generated cycle can actually achieve, so — however the random rates
// come out — there's always at least one qualifying rate per round and the
// rounds still get harder to reach as they go.
function generateStage3Setup(): Stage3Setup {
  const rateCycle = Array.from({ length: 8 }, () => randomInt(2, 20));
  const sortedAmounts = [...rateCycle].map((r) => compoundAmount(STAGE3_PRINCIPAL, r, STAGE3_YEARS)).sort((a, b) => a - b);
  const targets = [2, 4, 6].map((i) => Math.round((sortedAmounts[i] * 0.95) / 10) * 10);
  const goalNames = shuffle(SAVING_GOALS).slice(0, 3);
  const rounds = targets.map((target, i) => ({ savingFor: goalNames[i], target }));
  return { rateCycle, rounds };
}

function Stage3RateRush({ onCommit, isActive }: StageCanvasProps) {
  const [{ rateCycle, rounds }] = useState(generateStage3Setup);
  const [round, setRound] = useState(0);
  const [tickIndex, setTickIndex] = useState(0);
  const [flash, setFlash] = useState<'idle' | 'good' | 'bad'>('idle');
  const finalRoundWonRef = useRef(false);
  const effects = useSuccessEffects();

  const isFinalRound = round === rounds.length - 1;
  const goal = rounds[round];
  const currentRate = rateCycle[tickIndex];
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
    const id = setInterval(() => setTickIndex((i) => (i + 1) % rateCycle.length), STAGE3_TICK_MS);
    return () => clearInterval(id);
  }, [isActive, rateCycle.length]);

  function lockIn() {
    if (!isActive || flash !== 'idle') return;
    if (qualifies) {
      setFlash('good');
      effects.trigger();
      if (isFinalRound) {
        finalRoundWonRef.current = true;
        onCommit(1);
      } else {
        setTimeout(() => setRound((r) => r + 1), 500);
      }
    } else {
      setFlash('bad');
      if (isFinalRound) onCommit(clampScore(projected / goal.target));
      setTimeout(() => setFlash('idle'), 450);
    }
  }

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>
        Round {round + 1} of {rounds.length} · saving for {goal.savingFor} — need ${goal.target}+ after {STAGE3_YEARS} years
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

const STAGE4_MATCH_THRESHOLD = 95;
const STAGE4_START = { principal: 300, ratePct: 4, years: 5 };

function computeMatchPercent(principal: number, ratePct: number, years: number, target: number): number {
  const amount = compoundAmount(principal, ratePct, years);
  const diffPercent = (Math.abs(amount - target) / target) * 100;
  return Math.max(0, 100 - diffPercent);
}

// Randomized each playthrough, re-rolled if it would already be within
// reach of the sliders' fixed starting position.
function generateStage4Target(): number {
  const startingAmount = compoundAmount(STAGE4_START.principal, STAGE4_START.ratePct, STAGE4_START.years);
  for (let attempt = 0; attempt < 20; attempt++) {
    const target = randomInt(60, 200) * 10;
    if (computeMatchPercent(STAGE4_START.principal, STAGE4_START.ratePct, STAGE4_START.years, target) < 80) return target;
  }
  return Math.round(startingAmount * 2.7 / 10) * 10;
}

function Stage4MasterySandbox({ onCommit, isActive }: StageCanvasProps) {
  const [target] = useState(generateStage4Target);
  const [principal, setPrincipal] = useState(STAGE4_START.principal);
  const [ratePct, setRatePct] = useState(STAGE4_START.ratePct);
  const [years, setYears] = useState(STAGE4_START.years);
  const effects = useSuccessEffects();
  const wonRef = useRef(false);

  const finalAmount = compoundAmount(principal, ratePct, years);
  const matchPercent = computeMatchPercent(principal, ratePct, years, target);

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
      <Text style={styles.stageObjective}>Boss level: plan a {fmtMoney(target)} goal — tune every variable to land within {STAGE4_MATCH_THRESHOLD}% of it.</Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <Text style={styles.finalAmountLabel}>Projected final balance</Text>
        <Text style={[styles.finalAmountValue, { color: matchPercent >= STAGE4_MATCH_THRESHOLD ? DL_COLORS.lime : DL_COLORS.amethyst }]}>
          {fmtMoney(finalAmount)}
        </Text>
        <Text style={styles.stageHint}>Target: {fmtMoney(target)}</Text>
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

function buildMoneyGrowerStages(): MathStageConfig[] {
  return [
    {
      id: 'foundations',
      title: 'Foundations',
      objective: 'One year of simple growth — principal plus interest.',
      targetValue: 1,
      baseXp: 20,
      toleranceThreshold: 0,
      nearMiss: { thresholdPercent: 15, message: "So close — remember, it's the starting amount PLUS the interest." },
      checkWinCondition: (value, target) => value >= target,
      renderCanvas: Stage1Foundations,
    },
    {
      id: 'quantitative',
      title: 'Quantitative Mechanics',
      objective: 'Multiple years — each year compounds on the last.',
      targetValue: 1,
      baseXp: 40,
      toleranceThreshold: 0,
      nearMiss: { thresholdPercent: 10, message: 'Right idea — double-check you compounded the second year too.' },
      checkWinCondition: (value, target) => value >= target,
      renderCanvas: Stage2QuantitativeMechanics,
    },
    {
      id: 'variables',
      title: 'Rate Rush',
      objective: 'Catch a rate high enough to hit your savings goal.',
      targetValue: 1,
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
}

export default function MoneyGrowerGameModule() {
  const [playthrough, setPlaythrough] = useState(0);
  const stages = React.useMemo(buildMoneyGrowerStages, [playthrough]);
  return (
    <DeepLearningGameScreen
      key={playthrough}
      stages={stages}
      maxXp={220}
      realmId="compoundInterest"
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
