import Slider from '@react-native-community/slider';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReAnimated from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { useDeepLearning } from '../src/features/deep-learning/DeepLearningContext';
import { DeepLearningGameScreen } from '../src/features/deep-learning/GameChrome';
import { HintExplanationPanel } from '../src/features/deep-learning/HintExplanationPanel';
import { clampScore, randomInt } from '../src/features/deep-learning/mathUtils';
import { EntryDisplay, NumericKeypad } from '../src/features/deep-learning/NumericKeypad';
import { DL_COLORS } from '../src/features/deep-learning/theme';
import type { MathStageConfig, StageCanvasProps } from '../src/features/deep-learning/types';
import { ParticleBurst, useSuccessEffects } from '../src/features/deep-learning/useSuccessEffects';

// Height of a dropped object after t seconds (meters): h(t) = t².
function f(x: number): number {
  return x * x;
}
function avgVelocity(t: number, h: number): number {
  return (f(t + h) - f(t)) / h;
}

const CHART_W = 260;
const CHART_H = 180;
const PAD = 30;

function makeChartScales(xMin: number, xMax: number, yMin: number, yMax: number) {
  const plotW = CHART_W - PAD * 2;
  const plotH = CHART_H - PAD * 2;
  return {
    sx: (x: number) => PAD + ((x - xMin) / (xMax - xMin)) * plotW,
    sy: (y: number) => PAD + plotH - ((y - yMin) / (yMax - yMin)) * plotH,
  };
}

// ---------------------------------------------------------------------------
// Stage 1 — Foundations: "Catch the Instant" — squeeze h toward 0, by feel
// ---------------------------------------------------------------------------

const STAGE1_THRESHOLDS = [0.3, 0.1, 0.02];
const STAGE1_HOLD_MS = 1200;

// The thresholds stay fixed (they deliberately teach progressively tighter
// precision), but the point on the curve varies each playthrough.
function generateStage1Rounds(): { tPoint: number; threshold: number }[] {
  return STAGE1_THRESHOLDS.map((threshold) => ({ tPoint: randomInt(5, 20) / 10, threshold }));
}
const CURVE_X_MIN = -0.5;
const CURVE_X_MAX = 3;
const CURVE_Y_MIN = -0.5;
const CURVE_Y_MAX = 9;
const { sx: curveSx, sy: curveSy } = makeChartScales(CURVE_X_MIN, CURVE_X_MAX, CURVE_Y_MIN, CURVE_Y_MAX);
const CURVE_SAMPLES = 40;
const curvePath = Array.from({ length: CURVE_SAMPLES + 1 }, (_, i) => {
  const x = CURVE_X_MIN + (i / CURVE_SAMPLES) * (CURVE_X_MAX - CURVE_X_MIN);
  return { x: curveSx(x), y: curveSy(f(x)) };
})
  .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
  .join(' ');

function Stage1Foundations({ onCommit, isActive }: StageCanvasProps) {
  const [rounds] = useState(generateStage1Rounds);
  const [round, setRound] = useState(0);
  const [h, setH] = useState(1);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const finalRoundWonRef = useRef(false);
  const effects = useSuccessEffects();

  const isFinalRound = round === rounds.length - 1;
  const goal = rounds[round];
  const withinTolerance = h <= goal.threshold;

  useEffect(() => {
    finalRoundWonRef.current = false;
    setH(1);
  }, [round]);

  useEffect(() => {
    if (!isActive) return;
    if (!withinTolerance) {
      holdStartRef.current = null;
      setHoldProgress(0);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    if (holdStartRef.current === null) holdStartRef.current = Date.now();

    function tick() {
      const elapsed = Date.now() - (holdStartRef.current ?? Date.now());
      setHoldProgress(Math.min(1, elapsed / STAGE1_HOLD_MS));
      if (elapsed >= STAGE1_HOLD_MS) {
        holdStartRef.current = null;
        setHoldProgress(0);
        effects.trigger();
        if (!isFinalRound) {
          setRound((r) => r + 1);
        } else {
          finalRoundWonRef.current = true;
          onCommit(1);
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withinTolerance, isActive, round]);

  function handleRelease() {
    if (isFinalRound && !finalRoundWonRef.current) {
      // h can only overshoot the threshold from above (it's a one-sided
      // "get below this" target), so score it as how much smaller it would
      // still need to get, relative to the threshold itself.
      onCommit(clampScore(1 - (h - goal.threshold) / goal.threshold));
    }
  }

  const xA = goal.tPoint;
  const xB = xA + h;
  const yA = f(xA);
  const yB = f(xB);

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>
        Round {round + 1} of {rounds.length} · squeeze the interval below h = {goal.threshold}
      </Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`} role="img" accessibilityLabel="Falling object height curve">
          <Line x1={PAD} y1={curveSy(0)} x2={CHART_W - PAD} y2={curveSy(0)} stroke={DL_COLORS.border} strokeWidth={1.5} />
          <Path d={curvePath} fill="none" stroke={DL_COLORS.textMuted} strokeWidth={2} strokeLinecap="round" />
          <Line
            x1={curveSx(xA)}
            y1={curveSy(yA)}
            x2={curveSx(xB)}
            y2={curveSy(yB)}
            stroke={withinTolerance ? DL_COLORS.lime : DL_COLORS.amethyst}
            strokeWidth={3}
          />
          <Circle cx={curveSx(xA)} cy={curveSy(yA)} r={6} fill={DL_COLORS.text} />
          <Circle cx={curveSx(xB)} cy={curveSy(yB)} r={7} fill={withinTolerance ? DL_COLORS.lime : DL_COLORS.amethyst} />
          {effects.isBursting && <ParticleBurst progress={effects.burstProgress} />}
        </Svg>
        {holdProgress > 0 && (
          <View style={styles.holdTrack}>
            <View style={[styles.holdFill, { width: `${holdProgress * 100}%` }]} />
          </View>
        )}
      </ReAnimated.View>

      <Text style={styles.sliderLabel}>h (time window): {h.toFixed(2)}s</Text>
      <Slider
        style={styles.slider}
        minimumValue={0.01}
        maximumValue={1}
        step={0.01}
        value={h}
        onValueChange={setH}
        onSlidingComplete={handleRelease}
        minimumTrackTintColor={withinTolerance ? DL_COLORS.lime : DL_COLORS.amethyst}
        maximumTrackTintColor={DL_COLORS.surfaceMuted}
        thumbTintColor={withinTolerance ? DL_COLORS.lime : DL_COLORS.amethyst}
        accessibilityLabel="Time window h"
      />
      <HintExplanationPanel hint="Point B slides toward point A as the measuring window h shrinks — that's the limit in action. Hold it below the threshold." feedback="idle" />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage 2 — Quantitative Mechanics: real average-speed calculations
// ---------------------------------------------------------------------------

// avgVelocity(t, h) for f(x) = x² works out to exactly 2t + h, so keeping
// both integers guarantees a clean whole-number answer every time.
function generateStage2Problems(): { t: number; h: number; prompt: string }[] {
  const pairs: { t: number; h: number }[] = [];
  const used = new Set<string>();
  while (pairs.length < 3) {
    const t = randomInt(1, 6);
    const h = randomInt(1, 3);
    const key = `${t}-${h}`;
    if (used.has(key)) continue;
    used.add(key);
    pairs.push({ t, h });
  }
  return pairs.map(({ t, h }, i) => ({
    t,
    h,
    prompt:
      i === 0
        ? `A dropped object has height h(t) = t² meters. Between t = ${t}s and t = ${t + h}s, what is the AVERAGE speed (m/s)?`
        : `Same object. Between t = ${t}s and t = ${t + h}s, what is the AVERAGE speed (m/s)?`,
  }));
}

function Stage2QuantitativeMechanics({ onCommit, isActive }: StageCanvasProps) {
  const [problems] = useState(generateStage2Problems);
  const [round, setRound] = useState(0);
  const [entry, setEntry] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const finalRoundWonRef = useRef(false);
  const effects = useSuccessEffects();
  const { isNearMiss } = useDeepLearning();

  const isFinalRound = round === problems.length - 1;
  const problem = problems[round];
  const heightAtT = f(problem.t);
  const heightAtEnd = f(problem.t + problem.h);
  const answer = Math.round(avgVelocity(problem.t, problem.h));

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
      if (isFinalRound) onCommit(clampScore(1 - Math.abs(value - answer) / Math.max(1, Math.abs(answer))));
      setTimeout(() => {
        setEntry('');
        setFeedback('idle');
      }, 500);
    }
  }

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>Round {round + 1} of {problems.length} · average speed = distance ÷ time</Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <EntryDisplay prompt={problem.prompt} entry={entry} feedback={feedback} />
        {effects.isBursting && (
          <View style={styles.burstOverlay} pointerEvents="none">
            <ParticleBurst progress={effects.burstProgress} />
          </View>
        )}
      </ReAnimated.View>
      <NumericKeypad onDigit={pressDigit} onBackspace={backspace} onSubmit={submit} disabled={feedback !== 'idle'} />
      <HintExplanationPanel
        hint="Average speed = (height at the later time − height at the earlier time) ÷ time elapsed."
        explanation={
          feedback !== 'idle'
            ? `h(${problem.t}) = ${heightAtT}, h(${problem.t + problem.h}) = ${heightAtEnd}. (${heightAtEnd} − ${heightAtT}) ÷ ${problem.h} = ${answer}.`
            : null
        }
        feedback={feedback === 'idle' ? 'idle' : feedback === 'correct' ? 'correct' : isFinalRound && isNearMiss ? 'nearMiss' : 'wrong'}
        disabled={feedback !== 'idle'}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage 3 — Variables Challenge: "Speedometer Glitch" — catch the tight window
// ---------------------------------------------------------------------------

const STAGE3_H_START = 1.0;
const STAGE3_H_END = 0.02;
const STAGE3_CYCLE_MS = 3000;
const STAGE3_TICK_MS = 30;
const STAGE3_GOOD_THRESHOLD = 0.1;
const STAGE3_HOLD_MS = 3000;

function Stage3SpeedometerGlitch({ onCommit, isActive }: StageCanvasProps) {
  const [tPoint] = useState(() => randomInt(2, 5));
  const [cycleStart, setCycleStart] = useState(() => Date.now());
  const [h, setH] = useState(STAGE3_H_START);
  const [locking, setLocking] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const accumulatedMsRef = useRef(0);
  const segmentStartRef = useRef<number | null>(null);
  const effects = useSuccessEffects();

  // h drifts from H_START down to H_END over one cycle, then resets — the
  // "glitchy" measuring window that only occasionally reads tight enough to
  // trust. Eased (cubic ease-out) rather than linear so it drops quickly at
  // first and then settles into and lingers in the tight zone — a linear
  // sweep would spend well under 3 seconds' worth of "good" time per cycle,
  // making the 3-second hold target take 30+ seconds of real play.
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => {
      const elapsed = (Date.now() - cycleStart) % STAGE3_CYCLE_MS;
      const progress = elapsed / STAGE3_CYCLE_MS;
      const eased = 1 - Math.pow(1 - progress, 3);
      setH(STAGE3_H_START - eased * (STAGE3_H_START - STAGE3_H_END));
    }, STAGE3_TICK_MS);
    return () => clearInterval(id);
  }, [isActive, cycleStart]);

  const goodWindow = h <= STAGE3_GOOD_THRESHOLD;
  const engaged = locking && goodWindow;
  const liveVelocity = avgVelocity(tPoint, h);
  const trueVelocity = 2 * tPoint;

  useEffect(() => {
    if (!engaged) {
      if (segmentStartRef.current !== null) {
        accumulatedMsRef.current += Date.now() - segmentStartRef.current;
        segmentStartRef.current = null;
      }
      return;
    }
    if (segmentStartRef.current === null) segmentStartRef.current = Date.now();
    const id = setInterval(() => {
      const segmentMs = Date.now() - (segmentStartRef.current ?? Date.now());
      const totalMs = accumulatedMsRef.current + segmentMs;
      setHoldProgress(Math.min(1, totalMs / STAGE3_HOLD_MS));
      if (totalMs >= STAGE3_HOLD_MS) {
        clearInterval(id);
        segmentStartRef.current = null;
        accumulatedMsRef.current = 0;
        setHoldProgress(0);
        effects.trigger();
        onCommit(1);
      }
    }, 50);
    return () => clearInterval(id);
  }, [engaged]);

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>Hold LOCK only when the window is tight (h ≤ {STAGE3_GOOD_THRESHOLD}) — 3s total.</Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <Text style={styles.rateLabel}>Measuring window h</Text>
        <Text style={[styles.rateValue, { color: goodWindow ? DL_COLORS.lime : DL_COLORS.amethyst }]}>{h.toFixed(3)}</Text>
        <Text style={styles.reportLabel}>
          Speedometer reads: {liveVelocity.toFixed(2)} m/s (true speed: {trueVelocity} m/s)
        </Text>
        {effects.isBursting && (
          <View style={styles.burstOverlay} pointerEvents="none">
            <ParticleBurst progress={effects.burstProgress} />
          </View>
        )}
        {holdProgress > 0 && (
          <View style={styles.holdTrack}>
            <View style={[styles.holdFill, { width: `${holdProgress * 100}%`, backgroundColor: DL_COLORS.lime }]} />
          </View>
        )}
      </ReAnimated.View>
      <Pressable
        onPressIn={() => setLocking(true)}
        onPressOut={() => setLocking(false)}
        accessibilityRole="button"
        accessibilityLabel="Hold to lock the reading"
        style={[styles.lockButton, engaged && styles.lockButtonGood]}
      >
        <Text style={styles.lockButtonText}>{locking ? (goodWindow ? '🔒 Locked in!' : '🔓 Window too wide…') : '🔒 HOLD WHEN TIGHT'}</Text>
      </Pressable>
      <HintExplanationPanel hint="The window keeps resetting — hold across as many good passes as it takes to reach 3 seconds total. A tighter window means a more trustworthy reading." feedback="idle" />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage 4 — Mastery Sandbox: "Ramp Designer Boss" — match a target slope
// ---------------------------------------------------------------------------

const STAGE4_MATCH_THRESHOLD = 95;
const STAGE4_START = { a: 1, b: 0, c: 0 };
const RAMP_X_MIN = -1;
const RAMP_X_MAX = 4;
const RAMP_Y_MIN = -4;
const RAMP_Y_MAX = 12;
const { sx: rampSx, sy: rampSy } = makeChartScales(RAMP_X_MIN, RAMP_X_MAX, RAMP_Y_MIN, RAMP_Y_MAX);
const RAMP_SAMPLES = 40;

function quad(a: number, b: number, c: number, x: number): number {
  return a * x * x + b * x + c;
}
function quadSlope(a: number, b: number, x: number): number {
  return 2 * a * x + b;
}
function computeMatchPercent(a: number, b: number, targetX: number, targetSlope: number): number {
  const slope = quadSlope(a, b, targetX);
  const errorPercent = (Math.abs(slope - targetSlope) / Math.abs(targetSlope)) * 100;
  return Math.max(0, 100 - errorPercent);
}

// Randomized each playthrough, re-rolled if it would already be within
// reach of the sliders' fixed starting position.
function generateStage4Target(): { targetX: number; targetSlope: number } {
  for (let attempt = 0; attempt < 20; attempt++) {
    const targetX = randomInt(1, 3);
    // Kept within [-2, 11] regardless of targetX — the tightest achievable
    // window across x in [1,3] given the sliders' own ranges (a in [0.5,3],
    // b in [-5,5], slope = 2ax+b) is [x-5, 6x+5], whose intersection over
    // x in {1,2,3} is [-2, 11] (binding at x=3 on the low end, x=1 on the high).
    const targetSlope = randomInt(-2, 11) || 4;
    if (computeMatchPercent(STAGE4_START.a, STAGE4_START.b, targetX, targetSlope) < 80) return { targetX, targetSlope };
  }
  return { targetX: 2, targetSlope: 6 };
}

function Stage4MasterySandbox({ onCommit, isActive }: StageCanvasProps) {
  const [{ targetX, targetSlope }] = useState(generateStage4Target);
  const [a, setA] = useState(STAGE4_START.a);
  const [b, setB] = useState(STAGE4_START.b);
  const [c, setC] = useState(STAGE4_START.c);
  const effects = useSuccessEffects();
  const wonRef = useRef(false);

  const slope = quadSlope(a, b, targetX);
  const matchPercent = computeMatchPercent(a, b, targetX, targetSlope);

  useEffect(() => {
    if (!isActive || wonRef.current) return;
    if (matchPercent >= STAGE4_MATCH_THRESHOLD) {
      wonRef.current = true;
      effects.trigger();
      onCommit(matchPercent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchPercent, isActive]);

  const curvePathD = Array.from({ length: RAMP_SAMPLES + 1 }, (_, i) => {
    const x = RAMP_X_MIN + (i / RAMP_SAMPLES) * (RAMP_X_MAX - RAMP_X_MIN);
    return { x: rampSx(x), y: rampSy(quad(a, b, c, x)) };
  })
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
    .join(' ');

  const yAtTarget = quad(a, b, c, targetX);
  const tangentX1 = targetX - 0.8;
  const tangentX2 = targetX + 0.8;
  const tangentY1 = yAtTarget + slope * (tangentX1 - targetX);
  const tangentY2 = yAtTarget + slope * (tangentX2 - targetX);

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>
        Boss level: design a ramp y = ax² + bx + c whose steepness at x = {targetX} matches a target speed-gain of {targetSlope}.
      </Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`} role="img" accessibilityLabel="Ramp curve with tangent line">
          <Line x1={PAD} y1={rampSy(0)} x2={CHART_W - PAD} y2={rampSy(0)} stroke={DL_COLORS.border} strokeWidth={1.5} />
          <Path d={curvePathD} fill="none" stroke={matchPercent >= STAGE4_MATCH_THRESHOLD ? DL_COLORS.lime : DL_COLORS.amethyst} strokeWidth={3} strokeLinecap="round" />
          <Line x1={rampSx(tangentX1)} y1={rampSy(tangentY1)} x2={rampSx(tangentX2)} y2={rampSy(tangentY2)} stroke={DL_COLORS.text} strokeWidth={2} strokeDasharray="5,4" />
          <Circle cx={rampSx(targetX)} cy={rampSy(yAtTarget)} r={6} fill={DL_COLORS.text} />
          {effects.isBursting && <ParticleBurst progress={effects.burstProgress} />}
        </Svg>
        <Text style={styles.reportLabel}>Slope at x = {targetX}: {slope.toFixed(2)} (target: {targetSlope})</Text>
      </ReAnimated.View>

      <View style={styles.matchRow}>
        <Text style={styles.stageHint}>Match: </Text>
        <Text style={[styles.matchValue, { color: matchPercent >= STAGE4_MATCH_THRESHOLD ? DL_COLORS.lime : DL_COLORS.amethyst }]}>
          {matchPercent.toFixed(1)}%
        </Text>
      </View>

      <Text style={styles.sliderLabel}>a (curvature): {a.toFixed(1)}</Text>
      <Slider style={styles.slider} minimumValue={0.5} maximumValue={3} step={0.1} value={a} onValueChange={setA} minimumTrackTintColor={DL_COLORS.amethyst} maximumTrackTintColor={DL_COLORS.surfaceMuted} thumbTintColor={DL_COLORS.amethyst} />

      <Text style={styles.sliderLabel}>b (initial tilt): {b.toFixed(1)}</Text>
      <Slider style={styles.slider} minimumValue={-5} maximumValue={5} step={0.1} value={b} onValueChange={setB} minimumTrackTintColor={DL_COLORS.amethyst} maximumTrackTintColor={DL_COLORS.surfaceMuted} thumbTintColor={DL_COLORS.amethyst} />

      <Text style={styles.sliderLabel}>c (height offset): {c.toFixed(1)}</Text>
      <Slider style={styles.slider} minimumValue={-3} maximumValue={3} step={0.1} value={c} onValueChange={setC} minimumTrackTintColor={DL_COLORS.amethyst} maximumTrackTintColor={DL_COLORS.surfaceMuted} thumbTintColor={DL_COLORS.amethyst} />
      <HintExplanationPanel hint="Slope depends only on a and b — c just shifts the whole ramp up or down without changing its steepness." feedback="idle" />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage config + top-level module
// ---------------------------------------------------------------------------

function buildLimitChaserStages(): MathStageConfig[] {
  return [
    {
      id: 'foundations',
      title: 'Foundations',
      objective: 'Squeeze the measuring window toward zero, by feel.',
      targetValue: 1,
      baseXp: 20,
      toleranceThreshold: 0,
      nearMiss: { thresholdPercent: 60, message: 'Getting tighter — squeeze the window a little more.' },
      checkWinCondition: (value, target) => value >= target,
      renderCanvas: Stage1Foundations,
      skill: 'approaching a value (limits)',
      fastClearMs: 30000,
    },
    {
      id: 'quantitative',
      title: 'Quantitative Mechanics',
      objective: 'Calculate real average speeds over a time interval.',
      targetValue: 1,
      baseXp: 40,
      toleranceThreshold: 0,
      nearMiss: { thresholdPercent: 15, message: 'Close — double-check your subtraction before dividing by the time elapsed.' },
      checkWinCondition: (value, target) => value >= target,
      renderCanvas: Stage2QuantitativeMechanics,
      skill: 'numerical difference tables',
      fastClearMs: 25000,
    },
    {
      id: 'variables',
      title: 'Speedometer Glitch',
      objective: 'Catch the instant when the measuring window is trustworthy.',
      targetValue: 1,
      baseXp: 60,
      toleranceThreshold: 0.001,
      checkWinCondition: (value, target, tolerance) => Math.abs(value - target) <= tolerance,
      renderCanvas: Stage3SpeedometerGlitch,
      skill: 'graphical limits',
      fastClearMs: 30000,
    },
    {
      id: 'mastery',
      title: 'Mastery Sandbox',
      objective: 'Design a curve whose slope at a point matches a target.',
      targetValue: STAGE4_MATCH_THRESHOLD,
      baseXp: 100,
      toleranceThreshold: 0,
      checkWinCondition: (value, target) => value >= target,
      renderCanvas: Stage4MasterySandbox,
      skill: 'multi-step limit reasoning',
      fastClearMs: 40000,
    },
  ];
}

export default function LimitChaserGameModule() {
  const [playthrough, setPlaythrough] = useState(0);
  const stages = React.useMemo(buildLimitChaserStages, [playthrough]);
  return (
    <DeepLearningGameScreen
      key={playthrough}
      stages={stages}
      maxXp={220}
      realmId="calculus"
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
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 6,
  },
  burstOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  holdTrack: {
    width: '90%',
    height: 6,
    borderRadius: 999,
    backgroundColor: DL_COLORS.surfaceMuted,
    marginTop: 6,
    overflow: 'hidden',
  },
  holdFill: {
    height: '100%',
    backgroundColor: DL_COLORS.amethyst,
    borderRadius: 999,
  },
  slider: {
    width: '100%',
    height: 36,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: DL_COLORS.textMuted,
  },
  stageHint: {
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
    fontSize: 34,
    fontWeight: '800',
  },
  reportLabel: {
    fontSize: 12.5,
    color: DL_COLORS.text,
    textAlign: 'center',
    fontWeight: '700',
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
  lockButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: DL_COLORS.text,
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
