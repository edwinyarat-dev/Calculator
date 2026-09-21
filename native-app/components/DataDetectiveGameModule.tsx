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

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(1, n));
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
// Stage 1 — Foundations: "Spot the Middle Suspect" — tap the median, by eye
// ---------------------------------------------------------------------------

const NUMBER_LINE_W = 260;
const NUMBER_LINE_Y = 90;
const PAD = 24;

// Evenly spaced (with a little jitter) rather than pure-uniform-random —
// picking 5 fully independent random values risked one outlier compressing
// the rest so close together on the number line that their tap targets
// visually overlapped and became hard to tell apart (or to tap precisely).
function randomStage1Case(): { values: number[] } {
  const base = randomInt(5, 20);
  const step = 15;
  const values = Array.from({ length: 5 }, (_, i) => base + i * step + randomInt(-2, 2));
  return { values: shuffle(values) };
}
function generateStage1Cases(): { values: number[] }[] {
  return Array.from({ length: 3 }, randomStage1Case);
}

function Stage1Foundations({ onCommit, isActive }: StageCanvasProps) {
  const [cases] = useState(generateStage1Cases);
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const finalRoundWonRef = useRef(false);
  const effects = useSuccessEffects();

  const isFinalRound = round === cases.length - 1;
  const caseData = cases[round];
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
        onCommit(1);
      } else {
        setTimeout(() => setRound((r) => r + 1), 500);
      }
    } else {
      setFeedback('wrong');
      if (isFinalRound) {
        // How far off the tapped value's sorted rank was from the true
        // middle rank — a rough but desync-proof closeness score, since it
        // only depends on rank, not the (randomized) values themselves.
        const sorted = [...caseData.values].sort((a, b) => a - b);
        const middleIndex = (sorted.length - 1) / 2;
        const tappedIndex = sorted.indexOf(value);
        onCommit(clampScore(1 - Math.abs(tappedIndex - middleIndex) / middleIndex));
      }
      setTimeout(() => setFeedback('idle'), 500);
    }
  }

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>Round {round + 1} of {cases.length}</Text>
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

interface CaseFile {
  prompt: string;
  answer: number;
}

// Retries until six random measurements happen to average to a whole
// number, keeping the typed-answer format clean.
function randomMeanCase(): CaseFile {
  for (let attempt = 0; attempt < 100; attempt++) {
    const values = Array.from({ length: 6 }, () => randomInt(5, 40));
    const total = values.reduce((s, v) => s + v, 0);
    if (total % 6 === 0) {
      return { prompt: `Case file: six shell casings were measured at ${values.join(', ')} mm. What is the MEAN measurement?`, answer: total / 6 };
    }
  }
  return { prompt: 'Case file: six shell casings were measured at 10, 20, 30, 15, 25, 20 mm. What is the MEAN measurement?', answer: 20 };
}

// Retries until the two middle (sorted) values of six random numbers sum to
// an even number, so their median lands on a whole number.
function randomMedianCase(): CaseFile {
  for (let attempt = 0; attempt < 100; attempt++) {
    const values = Array.from({ length: 6 }, () => randomInt(2, 25));
    const stats = computeStats(values);
    if (stats && Number.isInteger(stats.median)) {
      return { prompt: `Case file: a getaway car was clocked over six blocks at ${values.join(', ')} seconds per block. What is the MEDIAN time?`, answer: stats.median };
    }
  }
  return { prompt: 'Case file: a getaway car was clocked over six blocks at 3, 7, 9, 11, 13, 17 seconds per block. What is the MEDIAN time?', answer: 10 };
}

// Retries until one value appears more often than any other, so the mode is unambiguous.
function randomModeCase(): CaseFile {
  for (let attempt = 0; attempt < 100; attempt++) {
    const modeValue = randomInt(3, 10);
    const values = shuffle([modeValue, modeValue, modeValue, randomInt(3, 10), randomInt(3, 10), randomInt(3, 10)]);
    const stats = computeStats(values);
    if (stats && stats.modes.length === 1 && stats.modes[0] === modeValue) {
      return { prompt: `Case file: six witnesses reported the suspect wearing shoe size ${values.join(', ')}. What is the MODE (most common size)?`, answer: modeValue };
    }
  }
  return { prompt: 'Case file: six witnesses reported the suspect wearing shoe size 5, 7, 5, 9, 5, 3. What is the MODE (most common size)?', answer: 5 };
}

function generateStage2Cases(): CaseFile[] {
  return [randomMeanCase(), randomMedianCase(), randomModeCase()];
}

/** How close a wrong final-round answer was, as a 0–1 score — reported instead of the raw typed value so randomized problems can't desync the fixed win check. */
function scoreAgainst(typed: number, answer: number): number {
  return clampScore(1 - Math.abs(typed - answer) / Math.max(1, Math.abs(answer)));
}

function Stage2QuantitativeMechanics({ onCommit, isActive }: StageCanvasProps) {
  const [cases] = useState(generateStage2Cases);
  const [round, setRound] = useState(0);
  const [entry, setEntry] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const finalRoundWonRef = useRef(false);
  const effects = useSuccessEffects();

  const isFinalRound = round === cases.length - 1;
  const problem = cases[round];
  const answer = problem.answer;

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
      <Text style={styles.stageObjective}>Round {round + 1} of {cases.length} · case files</Text>
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
const STAGE3_STORIES = ['speeding', 'reckless driving', 'a felony charge'];

interface Stage3Round {
  stream: number[];
  target: number;
  story: string;
}

// Each round's target is set directly from the stream's own actual peak
// running average (not just its final value, since a running average isn't
// monotonic) — so however the random reports come out, hitting the target
// is always genuinely reachable, and harder rounds ask for a target closer
// to that ceiling.
function generateStage3Rounds(): Stage3Round[] {
  const stories = shuffle(STAGE3_STORIES);
  const fractions = [0.8, 0.9, 0.97];
  return stories.map((story, i) => {
    const stream = Array.from({ length: 7 }, () => randomInt(25, 90));
    let runningSum = 0;
    const runningMeans = stream.map((v, idx) => {
      runningSum += v;
      return runningSum / (idx + 1);
    });
    const peakRunningMean = Math.max(...runningMeans);
    const target = Math.min(Math.round((peakRunningMean * fractions[i]) / 5) * 5, Math.floor(peakRunningMean));
    return { stream, target, story };
  });
}

function Stage3RunningAverage({ onCommit, isActive }: StageCanvasProps) {
  const [rounds] = useState(generateStage3Rounds);
  const [round, setRound] = useState(0);
  const [tickIndex, setTickIndex] = useState(0);
  const [flash, setFlash] = useState<'idle' | 'good' | 'bad'>('idle');
  const finalRoundWonRef = useRef(false);
  const effects = useSuccessEffects();

  const isFinalRound = round === rounds.length - 1;
  const goal = rounds[round];
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
        onCommit(1);
      } else {
        setTimeout(() => setRound((r) => r + 1), 500);
      }
    } else {
      setFlash('bad');
      if (isFinalRound) onCommit(clampScore(runningMean / goal.target));
      setTimeout(() => setFlash('idle'), 450);
    }
  }

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>
        Round {round + 1} of {rounds.length} · lock in the case once the average justifies {goal.story} (avg ≥ {goal.target})
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

const STAGE4_MATCH_THRESHOLD = 95;
const STAGE4_MIN = 140;
const STAGE4_MAX = 200;
const STAGE4_START_HEIGHTS = [150, 155, 160, 165, 170];

function computeMatchPercent(heights: number[], targetMean: number, targetRange: number): number {
  const m = mean(heights);
  const range = Math.max(...heights) - Math.min(...heights);
  const meanErrorPct = (Math.abs(m - targetMean) / targetMean) * 100;
  const rangeErrorPct = (Math.abs(range - targetRange) / targetRange) * 100;
  return Math.max(0, 100 - (meanErrorPct + rangeErrorPct) / 2);
}

// Randomized each playthrough, re-rolled if it would already be within
// reach of the sliders' fixed starting position.
function generateStage4Target(): { targetMean: number; targetRange: number } {
  for (let attempt = 0; attempt < 20; attempt++) {
    const targetMean = randomInt(150, 190);
    const targetRange = randomInt(15, 45);
    if (computeMatchPercent(STAGE4_START_HEIGHTS, targetMean, targetRange) < 80) return { targetMean, targetRange };
  }
  return { targetMean: 170, targetRange: 30 };
}

function Stage4MasterySandbox({ onCommit, isActive }: StageCanvasProps) {
  const [{ targetMean, targetRange }] = useState(generateStage4Target);
  const [heights, setHeights] = useState(STAGE4_START_HEIGHTS);
  const effects = useSuccessEffects();
  const wonRef = useRef(false);

  const m = mean(heights);
  const range = Math.max(...heights) - Math.min(...heights);
  const matchPercent = computeMatchPercent(heights, targetMean, targetRange);

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
        Boss level: build a profile with mean height {targetMean}cm and range {targetRange}cm — {STAGE4_MATCH_THRESHOLD}%+ to win.
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
            y1={chartH - 10 - scaleY(targetMean)}
            x2={chartW}
            y2={chartH - 10 - scaleY(targetMean)}
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

function buildDataDetectiveStages(): MathStageConfig[] {
  return [
    {
      id: 'foundations',
      title: 'Foundations',
      objective: 'Spot the median by eye, no calculation needed.',
      targetValue: 1,
      baseXp: 20,
      toleranceThreshold: 0,
      nearMiss: { thresholdPercent: 40, message: "Close — remember to sort them first, then find the one in the middle." },
      checkWinCondition: (value, target) => value >= target,
      renderCanvas: Stage1Foundations,
    },
    {
      id: 'quantitative',
      title: 'Quantitative Mechanics',
      objective: 'Calculate mean, median, and mode from real case data.',
      targetValue: 1,
      baseXp: 40,
      toleranceThreshold: 0,
      nearMiss: { thresholdPercent: 15, message: "Close — double-check which measure of the data you were asked for." },
      checkWinCondition: (value, target) => value >= target,
      renderCanvas: Stage2QuantitativeMechanics,
    },
    {
      id: 'variables',
      title: 'Running Average',
      objective: 'Watch the average shift as new evidence arrives.',
      targetValue: 1,
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
}

export default function DataDetectiveGameModule() {
  const [playthrough, setPlaythrough] = useState(0);
  const stages = React.useMemo(buildDataDetectiveStages, [playthrough]);
  return (
    <DeepLearningGameScreen
      key={playthrough}
      stages={stages}
      maxXp={220}
      realmId="statistics"
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
