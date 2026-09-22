import React, { useEffect, useRef, useState } from 'react';
import Slider from '@react-native-community/slider';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReAnimated from 'react-native-reanimated';
import { CoinCatch } from '../src/features/deep-learning/AnswerWidgets';
import { useDeepLearning } from '../src/features/deep-learning/DeepLearningContext';
import { DeepLearningGameScreen } from '../src/features/deep-learning/GameChrome';
import { HintExplanationPanel } from '../src/features/deep-learning/HintExplanationPanel';
import { LearnTheMove, LearnTheMoveButton, MoneyBar } from '../src/features/deep-learning/LearnTheMove';
import { clampScore, numericOptions, randomInt, scoreAgainst, shuffle } from '../src/features/deep-learning/mathUtils';
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

// Fixed teaching numbers for the Stage 1 walkthrough — deliberately not
// derived from the quiz's random problems, so the worked example never
// previews a round's actual answer. $100 at 10% is the classic textbook
// pair specifically because both operations land on clean whole dollars.
const LEARN_STAGE1_STEPS = [
  {
    title: 'Start with your balance',
    body: 'Say you put $100 in a savings account. That $100 is your principal — the amount you actually put in.',
    visual: (
      <MoneyBar
        segments={[{ value: 100, color: DL_COLORS.amethyst, label: '$100' }]}
        maxValue={110}
        caption="Principal: $100"
      />
    ),
  },
  {
    title: 'The bank adds a percentage',
    body: 'At 10% a year, the bank pays you 10% of your $100. That’s $100 × 0.10 = $10 — the interest.',
    visual: (
      <MoneyBar
        segments={[
          { value: 100, color: DL_COLORS.amethyst, label: '$100' },
          { value: 10, color: DL_COLORS.lime, label: '+$10' },
        ]}
        maxValue={110}
        caption="$100 × 10% = $10 interest"
      />
    ),
  },
  {
    title: 'Add it to your balance',
    body: 'Principal plus interest is your new total: $100 + $10 = $110. That’s the whole move.',
    visual: (
      <MoneyBar
        segments={[
          { value: 100, color: DL_COLORS.amethyst, label: '$100' },
          { value: 10, color: DL_COLORS.lime, label: '+$10' },
        ]}
        maxValue={110}
        totalLabel="$110 total"
      />
    ),
  },
  {
    title: 'One formula, every time',
    body: 'Total = principal + (principal × rate%). Same move every round, just different numbers. Your turn.',
  },
];

function Stage1Foundations({ onCommit, isActive }: StageCanvasProps) {
  const [problems] = useState(generateStage1Problems);
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showLearn, setShowLearn] = useState(true);
  const finalRoundWonRef = useRef(false);
  const effects = useSuccessEffects();
  const { isNearMiss } = useDeepLearning();

  const isFinalRound = round === problems.length - 1;
  const problem = problems[round];
  const interest = Math.round((problem.principal * problem.ratePct) / 100);
  const answer = Math.round(compoundAmount(problem.principal, problem.ratePct, 1));
  const options = React.useMemo(() => numericOptions(answer, 6, 0.15), [round]);

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
        setTimeout(() => setRound((r) => r + 1), 650);
      }
    } else {
      setFeedback('wrong');
      if (isFinalRound) onCommit(scoreAgainst(value, answer));
      setTimeout(() => {
        setSelected(null);
        setFeedback('idle');
      }, 1200);
    }
  }

  return (
    <View style={styles.stageBody}>
      <LearnTheMove visible={showLearn} onDismiss={() => setShowLearn(false)} moduleTitle="How Interest Grows Your Money" steps={LEARN_STAGE1_STEPS} />
      <Text style={styles.stageObjective}>Round {round + 1} of {problems.length} · a piggy bank that pays interest</Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <Text style={styles.promptText}>
          You put ${problem.principal} in a savings account paying {problem.ratePct}% a year. After 1 year, how much do you have?
        </Text>
        {effects.isBursting && (
          <View style={styles.burstOverlay} pointerEvents="none">
            <ParticleBurst progress={effects.burstProgress} />
          </View>
        )}
      </ReAnimated.View>
      <CoinCatch options={options} selected={selected} correctValue={answer} feedback={feedback} onSelect={handleSelect} prefix="$" />
      {feedback === 'idle' && <LearnTheMoveButton onPress={() => setShowLearn(true)} />}
      <HintExplanationPanel
        hint={`Multiply $${problem.principal} by ${problem.ratePct}% to get the interest, then add it to $${problem.principal}.`}
        explanation={feedback !== 'idle' ? `$${problem.principal} × ${problem.ratePct}% = $${interest} interest. $${problem.principal} + $${interest} = $${answer}.` : null}
        feedback={feedback === 'idle' ? 'idle' : feedback === 'correct' ? 'correct' : isFinalRound && isNearMiss ? 'nearMiss' : 'wrong'}
        disabled={feedback !== 'idle'}
      />
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

// This stage's near-miss message already flags the #1 mistake here — forgetting
// that year 2 compounds off year 1's NEW balance, not the original principal.
// The walkthrough builds straight at that misconception: it shows the wrong
// (simple-interest) answer right next to the correct (compound) one so the
// gap between them is the actual lesson, not an afterthought.
const LEARN_STAGE2_STEPS = [
  {
    title: 'Year one grows like normal',
    body: '$100 at 10% for one year becomes $110 — same principal-plus-interest move as before.',
    visual: (
      <MoneyBar
        segments={[
          { value: 100, color: DL_COLORS.amethyst, label: '$100' },
          { value: 10, color: DL_COLORS.lime, label: '+$10' },
        ]}
        maxValue={121}
        totalLabel="$110 after year 1"
      />
    ),
  },
  {
    title: 'Year two grows from the NEW balance',
    body: 'Here’s the part everyone forgets: year two’s interest is 10% of $110 — not the original $100. That’s $110 × 10% = $11.',
    visual: (
      <MoneyBar
        segments={[
          { value: 110, color: DL_COLORS.amethyst, label: '$110' },
          { value: 11, color: DL_COLORS.lime, label: '+$11' },
        ]}
        maxValue={121}
        caption="$110 × 10% = $11 more interest"
      />
    ),
  },
  {
    title: 'That extra dollar is compounding',
    body: 'Compound it correctly and you get $121. Forget to compound (just add $10 twice) and you’d land on $120 — wrong. That gap only grows with more years.',
    visual: (
      <View style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-end' }}>
        <MoneyBar
          segments={[{ value: 120, color: DL_COLORS.danger, label: '$120' }]}
          maxValue={121}
          caption="❌ Simple interest (wrong)"
        />
        <MoneyBar
          segments={[
            { value: 110, color: DL_COLORS.amethyst, label: '$110' },
            { value: 11, color: DL_COLORS.lime, label: '+$11' },
          ]}
          maxValue={121}
          totalLabel="$121"
          caption="✅ Compound interest (right)"
        />
      </View>
    ),
  },
  {
    title: 'The rule',
    body: 'Every year, grow from LAST year’s balance — never the original principal. Your turn.',
  },
];

function Stage2QuantitativeMechanics({ onCommit, isActive }: StageCanvasProps) {
  const [problems] = useState(generateStage2Problems);
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showLearn, setShowLearn] = useState(true);
  const finalRoundWonRef = useRef(false);
  const effects = useSuccessEffects();
  const { isNearMiss } = useDeepLearning();

  const isFinalRound = round === problems.length - 1;
  const problem = problems[round];
  const year1Balance = Math.round(compoundAmount(problem.principal, problem.ratePct, 1));
  const answer = Math.round(compoundAmount(problem.principal, problem.ratePct, problem.years));
  const options = React.useMemo(() => numericOptions(answer, 6, 0.15), [round]);

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
        setTimeout(() => setRound((r) => r + 1), 650);
      }
    } else {
      setFeedback('wrong');
      if (isFinalRound) onCommit(scoreAgainst(value, answer));
      setTimeout(() => {
        setSelected(null);
        setFeedback('idle');
      }, 1200);
    }
  }

  return (
    <View style={styles.stageBody}>
      <LearnTheMove visible={showLearn} onDismiss={() => setShowLearn(false)} moduleTitle="Why Compounding Beats Simple Interest" steps={LEARN_STAGE2_STEPS} />
      <Text style={styles.stageObjective}>Round {round + 1} of {problems.length} · the balance compounds every year</Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <Text style={styles.promptText}>
          ${problem.principal} at {problem.ratePct}% a year, left alone for {problem.years} years. What's the balance?
        </Text>
        {effects.isBursting && (
          <View style={styles.burstOverlay} pointerEvents="none">
            <ParticleBurst progress={effects.burstProgress} />
          </View>
        )}
      </ReAnimated.View>
      <CoinCatch options={options} selected={selected} correctValue={answer} feedback={feedback} onSelect={handleSelect} prefix="$" />
      {feedback === 'idle' && <LearnTheMoveButton onPress={() => setShowLearn(true)} />}
      <HintExplanationPanel
        hint="Each year grows from LAST year's balance, not the original amount — compound it one year at a time."
        explanation={
          feedback !== 'idle'
            ? `Year 1: $${problem.principal} → $${year1Balance}.${problem.years > 1 ? ` Year 2: $${year1Balance} → $${answer}.` : ''}`
            : null
        }
        feedback={feedback === 'idle' ? 'idle' : feedback === 'correct' ? 'correct' : isFinalRound && isNearMiss ? 'nearMiss' : 'wrong'}
        disabled={feedback !== 'idle'}
      />
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
  const { isNearMiss } = useDeepLearning();

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
      <HintExplanationPanel
        hint={`The rate on offer keeps changing — a higher rate compounds into a much bigger balance over ${STAGE3_YEARS} years. Don't lock in too early.`}
        explanation={
          flash !== 'idle'
            ? `At ${currentRate}% for ${STAGE3_YEARS} years, ${fmtMoney(STAGE3_PRINCIPAL)} grows to ${fmtMoney(projected)} — that ${qualifies ? 'clears' : 'falls short of'} the ${fmtMoney(goal.target)} target for ${goal.savingFor}.`
            : null
        }
        feedback={flash === 'idle' ? 'idle' : flash === 'good' ? 'correct' : isFinalRound && isNearMiss ? 'nearMiss' : 'wrong'}
        disabled={flash !== 'idle'}
      />
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
      skill: 'simple interest',
      fastClearMs: 20000,
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
      skill: 'compound interest',
      fastClearMs: 25000,
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
      skill: 'comparing growth scenarios',
      fastClearMs: 20000,
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
      skill: 'real-world financial planning',
      fastClearMs: 30000,
    },
  ];
}

export default function MoneyGrowerGameModule({ onNextRealm }: { onNextRealm?: () => void }) {
  const [playthrough, setPlaythrough] = useState(0);
  const stages = React.useMemo(buildMoneyGrowerStages, [playthrough]);
  return (
    <DeepLearningGameScreen
      key={playthrough}
      stages={stages}
      maxXp={220}
      realmId="compoundInterest"
      onRestart={() => setPlaythrough((p) => p + 1)}
      onNextRealm={onNextRealm}
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
  promptText: {
    fontSize: 17,
    fontWeight: '700',
    color: DL_COLORS.text,
    textAlign: 'center',
    lineHeight: 23,
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
