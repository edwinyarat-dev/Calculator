import React, { useEffect, useRef, useState } from 'react';
import Slider from '@react-native-community/slider';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReAnimated from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';
import { DeepLearningGameScreen } from '../src/features/deep-learning/GameChrome';
import { EntryDisplay, NumericKeypad } from '../src/features/deep-learning/NumericKeypad';
import { DL_COLORS } from '../src/features/deep-learning/theme';
import type { MathStageConfig, StageCanvasProps } from '../src/features/deep-learning/types';
import { ParticleBurst, useSuccessEffects } from '../src/features/deep-learning/useSuccessEffects';
import { computeStats } from '../utils/statistics';

function mean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length;
}

// ---------------------------------------------------------------------------
// Stage 1 — Foundations: "Spot the Middle Suspect" — tap the median, by eye
// ---------------------------------------------------------------------------

const STAGE1_CASES = [
  { values: [34, 28, 41, 25, 37] },
  { values: [12, 19, 7, 15, 10] },
  { values: [60, 45, 72, 50, 68] },
];
const NUMBER_LINE_W = 260;
const NUMBER_LINE_Y = 90;
const PAD = 24;

function Stage1Foundations({ onCommit, isActive }: StageCanvasProps) {
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const finalRoundWonRef = useRef(false);
  const effects = useSuccessEffects();

  const isFinalRound = round === STAGE1_CASES.length - 1;
  const caseData = STAGE1_CASES[round];
  const stats = computeStats(caseData.values)!;
  const trueMedian = stats.median;

  useEffect(() => {
    finalRoundWonRef.current = false;
    setFeedback('idle');
  }, [round]);

  const domainMin = Math.min(...caseData.values) - 5;
  const domainMax = Math.max(...caseData.values) + 5;
  const scaleX = (v: number) => PAD + ((v - domainMin) / (domainMax - domainMin)) * (NUMBER_LINE_W - PAD * 2);

  function tapValue(value: number) {
    if (!isActive || feedback !== 'idle') return;
    if (value === trueMedian) {
      setFeedback('correct');
      effects.trigger();
      if (isFinalRound) {
        finalRoundWonRef.current = true;
        onCommit(value);
      } else {
        setTimeout(() => setRound((r) => r + 1), 500);
      }
    } else {
      setFeedback('wrong');
      if (isFinalRound) onCommit(value);
      setTimeout(() => setFeedback('idle'), 500);
    }
  }

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>Round {round + 1} of {STAGE1_CASES.length}</Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <Text style={styles.casePrompt}>
          Case #{round + 1}: witnesses reported these values — {caseData.values.join(', ')}. Tap the MIDDLE one (the median).
        </Text>
        <Svg width="100%" height={130} viewBox={`0 0 ${NUMBER_LINE_W} 130`} role="img" accessibilityLabel="Number line of reported values">
          <Line x1={PAD} y1={NUMBER_LINE_Y} x2={NUMBER_LINE_W - PAD} y2={NUMBER_LINE_Y} stroke={DL_COLORS.border} strokeWidth={2} />
          {caseData.values.map((v, i) => {
            const isCorrectDot = feedback !== 'idle' && v === trueMedian;
            return (
              <Circle
                key={i}
                cx={scaleX(v)}
                cy={NUMBER_LINE_Y}
                r={14}
                fill={isCorrectDot ? DL_COLORS.lime : DL_COLORS.amethyst}
                stroke={DL_COLORS.bgDeep}
                strokeWidth={1.5}
                onPress={() => tapValue(v)}
                accessibilityLabel={`Value ${v}`}
              />
            );
          })}
        </Svg>
        {effects.isBursting && (
          <View style={styles.burstOverlay} pointerEvents="none">
            <ParticleBurst progress={effects.burstProgress} />
          </View>
        )}
      </ReAnimated.View>
      <Text style={styles.stageHint}>Sort them in your head first, then tap the one right in the middle.</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage 2 — Quantitative Mechanics: real case files needing mean/median/mode
// ---------------------------------------------------------------------------

const STAGE2_CASES = [
  { prompt: 'Case file: six shell casings were measured at 10, 20, 30, 15, 25, 20 mm. What is the MEAN measurement?', values: [10, 20, 30, 15, 25, 20], answer: (v: number[]) => Math.round(mean(v)) },
  { prompt: 'Case file: a getaway car was clocked over six blocks at 3, 7, 9, 11, 13, 17 seconds per block. What is the MEDIAN time?', values: [3, 7, 9, 11, 13, 17], answer: (v: number[]) => computeStats(v)!.median },
  { prompt: 'Case file: six witnesses reported the suspect wearing shoe size 5, 7, 5, 9, 5, 3. What is the MODE (most common size)?', values: [5, 7, 5, 9, 5, 3], answer: (v: number[]) => computeStats(v)!.modes[0] },
];

function Stage2QuantitativeMechanics({ onCommit, isActive }: StageCanvasProps) {
  const [round, setRound] = useState(0);
  const [entry, setEntry] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const finalRoundWonRef = useRef(false);
  const effects = useSuccessEffects();

  const isFinalRound = round === STAGE2_CASES.length - 1;
  const problem = STAGE2_CASES[round];
  const answer = problem.answer(problem.values);

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
      <Text style={styles.stageObjective}>Round {round + 1} of {STAGE2_CASES.length} · case files</Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <EntryDisplay prompt={problem.prompt} entry={entry} feedback={feedback} />
        {effects.isBursting && (
          <View style={styles.burstOverlay} pointerEvents="none">
            <ParticleBurst progress={effects.burstProgress} />
          </View>
        )}
      </ReAnimated.View>
      <NumericKeypad onDigit={pressDigit} onBackspace={backspace} onSubmit={submit} disabled={feedback !== 'idle'} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage 3 — Variables Challenge: "Running Average" — catch the mean in time
// ---------------------------------------------------------------------------

const STAGE3_TICK_MS = 900;
const STAGE3_ROUNDS = [
  { stream: [30, 45, 60, 70, 55, 40, 65], target: 50, story: 'speeding' },
  { stream: [50, 60, 40, 70, 65, 45, 80], target: 55, story: 'reckless driving' },
  { stream: [60, 70, 55, 80, 75, 50, 90], target: 65, story: 'a felony charge' },
];

function Stage3RunningAverage({ onCommit, isActive }: StageCanvasProps) {
  const [round, setRound] = useState(0);
  const [tickIndex, setTickIndex] = useState(0);
  const [flash, setFlash] = useState<'idle' | 'good' | 'bad'>('idle');
  const finalRoundWonRef = useRef(false);
  const effects = useSuccessEffects();

  const isFinalRound = round === STAGE3_ROUNDS.length - 1;
  const goal = STAGE3_ROUNDS[round];
  const revealed = goal.stream.slice(0, tickIndex + 1);
  const runningMean = mean(revealed);
  const qualifies = runningMean >= goal.target;

  useEffect(() => {
    finalRoundWonRef.current = false;
    setFlash('idle');
    setTickIndex(0);
  }, [round]);

  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => setTickIndex((i) => (i + 1) % goal.stream.length), STAGE3_TICK_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, round]);

  function lockIn() {
    if (!isActive || flash !== 'idle') return;
    if (qualifies) {
      setFlash('good');
      effects.trigger();
      if (isFinalRound) {
        finalRoundWonRef.current = true;
        onCommit(runningMean);
      } else {
        setTimeout(() => setRound((r) => r + 1), 500);
      }
    } else {
      setFlash('bad');
      if (isFinalRound) onCommit(runningMean);
      setTimeout(() => setFlash('idle'), 450);
    }
  }

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>
        Round {round + 1} of {STAGE3_ROUNDS.length} · lock in the case once the average justifies {goal.story} (avg ≥ {goal.target})
      </Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <Text style={styles.reportLabel}>Reports so far: {revealed.join(', ')}</Text>
        <Text style={styles.rateLabel}>Running average</Text>
        <Text style={[styles.rateValue, { color: qualifies ? DL_COLORS.lime : DL_COLORS.amethyst }]}>{runningMean.toFixed(1)}</Text>
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
        accessibilityLabel="Lock in the investigation"
        style={[styles.lockButton, flash === 'good' && styles.lockButtonGood, flash === 'bad' && styles.lockButtonBad]}
      >
        <Text style={styles.lockButtonText}>
          {flash === 'good' ? '✓ Case locked!' : flash === 'bad' ? '✗ Not enough evidence yet' : 'LOCK IN THE CASE'}
        </Text>
      </Pressable>
      <Text style={styles.stageHint}>New reports keep arriving — one low report can drag the average back down.</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage 4 — Mastery Sandbox: "Profile Builder Boss" — match mean AND range
// ---------------------------------------------------------------------------

const STAGE4_TARGET_MEAN = 170;
const STAGE4_TARGET_RANGE = 30;
const STAGE4_MATCH_THRESHOLD = 95;
const STAGE4_MIN = 140;
const STAGE4_MAX = 200;

function computeMatchPercent(heights: number[]): number {
  const m = mean(heights);
  const range = Math.max(...heights) - Math.min(...heights);
  const meanErrorPct = (Math.abs(m - STAGE4_TARGET_MEAN) / STAGE4_TARGET_MEAN) * 100;
  const rangeErrorPct = (Math.abs(range - STAGE4_TARGET_RANGE) / STAGE4_TARGET_RANGE) * 100;
  return Math.max(0, 100 - (meanErrorPct + rangeErrorPct) / 2);
}

function Stage4MasterySandbox({ onCommit, isActive }: StageCanvasProps) {
  const [heights, setHeights] = useState([150, 155, 160, 165, 170]);
  const effects = useSuccessEffects();
  const wonRef = useRef(false);

  const m = mean(heights);
  const range = Math.max(...heights) - Math.min(...heights);
  const matchPercent = computeMatchPercent(heights);

  useEffect(() => {
    if (!isActive || wonRef.current) return;
    if (matchPercent >= STAGE4_MATCH_THRESHOLD) {
      wonRef.current = true;
      effects.trigger();
      onCommit(matchPercent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchPercent, isActive]);

  function setHeight(index: number, value: number) {
    setHeights((prev) => prev.map((h, i) => (i === index ? value : h)));
  }

  const chartW = 260;
  const chartH = 130;
  const barW = 28;
  const gap = (chartW - barW * heights.length) / (heights.length + 1);
  const scaleY = (h: number) => ((h - STAGE4_MIN) / (STAGE4_MAX - STAGE4_MIN)) * (chartH - 20);

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>
        Boss level: build a profile with mean height {STAGE4_TARGET_MEAN}cm and range {STAGE4_TARGET_RANGE}cm — {STAGE4_MATCH_THRESHOLD}%+ to win.
      </Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <Svg width="100%" height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} role="img" accessibilityLabel="Suspect height profile bar chart">
          {heights.map((h, i) => {
            const x = gap + i * (barW + gap);
            const barH = scaleY(h);
            return (
              <React.Fragment key={i}>
                <Line x1={x + barW / 2} y1={chartH - 10} x2={x + barW / 2} y2={chartH - 10 - barH} stroke={DL_COLORS.amethyst} strokeWidth={barW} strokeLinecap="round" />
              </React.Fragment>
            );
          })}
          <Line
            x1={0}
            y1={chartH - 10 - scaleY(STAGE4_TARGET_MEAN)}
            x2={chartW}
            y2={chartH - 10 - scaleY(STAGE4_TARGET_MEAN)}
            stroke={matchPercent >= STAGE4_MATCH_THRESHOLD ? DL_COLORS.lime : DL_COLORS.textMuted}
            strokeWidth={2}
            strokeDasharray="6,5"
          />
          {effects.isBursting && <ParticleBurst progress={effects.burstProgress} />}
        </Svg>
        <View style={styles.readoutRow}>
          <View style={styles.readoutTile}>
            <Text style={styles.readoutLabel}>Mean</Text>
            <Text style={styles.readoutValue}>{m.toFixed(1)}</Text>
          </View>
          <View style={styles.readoutTile}>
            <Text style={styles.readoutLabel}>Range</Text>
            <Text style={styles.readoutValue}>{range.toFixed(0)}</Text>
          </View>
          <View style={styles.readoutTile}>
            <Text style={[styles.readoutValue, { color: matchPercent >= STAGE4_MATCH_THRESHOLD ? DL_COLORS.lime : DL_COLORS.amethyst }]}>
              {matchPercent.toFixed(0)}%
            </Text>
          </View>
        </View>
      </ReAnimated.View>

      {heights.map((h, i) => (
        <View key={i}>
          <Text style={styles.sliderLabel}>Witness {i + 1} estimate: {h.toFixed(0)}cm</Text>
          <Slider
            style={styles.slider}
            minimumValue={STAGE4_MIN}
            maximumValue={STAGE4_MAX}
            step={1}
            value={h}
            onValueChange={(v) => setHeight(i, v)}
            minimumTrackTintColor={DL_COLORS.amethyst}
            maximumTrackTintColor={DL_COLORS.surfaceMuted}
            thumbTintColor={DL_COLORS.amethyst}
            accessibilityLabel={`Witness ${i + 1} height estimate`}
          />
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage config + top-level module
// ---------------------------------------------------------------------------

const DATA_DETECTIVE_STAGES: MathStageConfig[] = [
  {
    id: 'foundations',
    title: 'Foundations',
    objective: 'Spot the median by eye, no calculation needed.',
    targetValue: computeStats(STAGE1_CASES[STAGE1_CASES.length - 1].values)!.median,
    baseXp: 20,
    toleranceThreshold: 0,
    nearMiss: { thresholdPercent: 12, message: "Close — remember to sort them first, then find the one in the middle." },
    checkWinCondition: (value, target) => value === target,
    renderCanvas: Stage1Foundations,
  },
  {
    id: 'quantitative',
    title: 'Quantitative Mechanics',
    objective: 'Calculate mean, median, and mode from real case data.',
    targetValue: STAGE2_CASES[STAGE2_CASES.length - 1].answer(STAGE2_CASES[STAGE2_CASES.length - 1].values),
    baseXp: 40,
    toleranceThreshold: 0,
    nearMiss: { thresholdPercent: 15, message: "Close — double-check which measure of the data you were asked for." },
    checkWinCondition: (value, target) => value === target,
    renderCanvas: Stage2QuantitativeMechanics,
  },
  {
    id: 'variables',
    title: 'Running Average',
    objective: 'Watch the average shift as new evidence arrives.',
    targetValue: STAGE3_ROUNDS[STAGE3_ROUNDS.length - 1].target,
    baseXp: 60,
    toleranceThreshold: 0,
    nearMiss: { thresholdPercent: 8, message: "So close — one more strong report would have tipped the average." },
    checkWinCondition: (value, target) => value >= target,
    renderCanvas: Stage3RunningAverage,
  },
  {
    id: 'mastery',
    title: 'Mastery Sandbox',
    objective: 'Balance the evidence to match both the average and the spread.',
    targetValue: STAGE4_MATCH_THRESHOLD,
    baseXp: 100,
    toleranceThreshold: 0,
    checkWinCondition: (value, target) => value >= target,
    renderCanvas: Stage4MasterySandbox,
  },
];

export default function DataDetectiveGameModule() {
  return <DeepLearningGameScreen stages={DATA_DETECTIVE_STAGES} maxXp={220} realmId="statistics" />;
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
    gap: 8,
  },
  burstOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  casePrompt: {
    fontSize: 14,
    fontWeight: '700',
    color: DL_COLORS.text,
    textAlign: 'center',
    lineHeight: 19,
  },
  stageHint: {
    fontSize: 12.5,
    color: DL_COLORS.textMuted,
    textAlign: 'center',
  },
  reportLabel: {
    fontSize: 12.5,
    color: DL_COLORS.textMuted,
    textAlign: 'center',
  },
  rateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: DL_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rateValue: {
    fontSize: 36,
    fontWeight: '800',
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
  readoutRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  readoutTile: {
    flex: 1,
    backgroundColor: DL_COLORS.surfaceMuted,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
  },
  readoutLabel: {
    fontSize: 10,
    color: DL_COLORS.textMuted,
    textTransform: 'uppercase',
  },
  readoutValue: {
    fontSize: 15,
    fontWeight: '800',
    color: DL_COLORS.text,
    marginTop: 2,
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
