import Slider from '@react-native-community/slider';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReAnimated from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { DeepLearningGameScreen } from '../src/features/deep-learning/GameChrome';
import { HintExplanationPanel } from '../src/features/deep-learning/HintExplanationPanel';
import { clampScore, randomInt } from '../src/features/deep-learning/mathUtils';
import { DL_COLORS } from '../src/features/deep-learning/theme';
import type { MathStageConfig, StageCanvasProps } from '../src/features/deep-learning/types';
import { ParticleBurst, useSuccessEffects } from '../src/features/deep-learning/useSuccessEffects';

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Picks `count` distinct integers in [min, max], each at least minGap apart, for varied but fair rounds. */
function pickSpacedInts(count: number, min: number, max: number, minGap: number): number[] {
  const result: number[] = [];
  let guard = 0;
  while (result.length < count && guard < 300) {
    guard++;
    const candidate = randomInt(min, max);
    if (result.every((v) => Math.abs(v - candidate) >= minGap)) result.push(candidate);
  }
  while (result.length < count) result.push(randomInt(min, max));
  return result;
}

// ---------------------------------------------------------------------------
// Stage 1 — Foundations: match the target angle by feel
// ---------------------------------------------------------------------------

const STAGE1_TOLERANCE = 2;
const STAGE1_HOLD_MS = 1500;
const CANVAS_SIZE = 260;
const CANVAS_ORIGIN_X = 40;
const CANVAS_ORIGIN_Y = 220;
const ARM_LENGTH = 170;

function generateStage1Targets(): number[] {
  return pickSpacedInts(3, 15, 80, 12);
}

function angleToPoint(angleDeg: number) {
  const rad = toRad(angleDeg);
  return {
    x: CANVAS_ORIGIN_X + Math.cos(rad) * ARM_LENGTH,
    y: CANVAS_ORIGIN_Y - Math.sin(rad) * ARM_LENGTH,
  };
}

function Stage1Foundations({ onCommit, isActive }: StageCanvasProps) {
  const [targets] = useState(generateStage1Targets);
  const [round, setRound] = useState(0);
  const [liveAngle, setLiveAngle] = useState(20);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  // Guards against double-submitting the final round: the hold-timer and a
  // slider release can both fire in quick succession for the same attempt.
  const finalRoundWonRef = useRef(false);
  const effects = useSuccessEffects();

  const isFinalRound = round === targets.length - 1;
  const target = targets[round];
  const withinTolerance = Math.abs(liveAngle - target) <= STAGE1_TOLERANCE;

  useEffect(() => {
    finalRoundWonRef.current = false;
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
          setLiveAngle(20);
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

  // On the final round, a release that doesn't win still gets evaluated so a
  // near miss can surface the encouragement banner. Earlier rounds compare
  // against a different target than the one the shared engine is tracking,
  // so they stay purely local and skip this.
  function handleSlidingComplete(value: number) {
    if (isFinalRound && !finalRoundWonRef.current) {
      const overshoot = Math.max(0, Math.abs(value - target) - STAGE1_TOLERANCE);
      onCommit(clampScore(1 - overshoot / STAGE1_TOLERANCE));
    }
  }

  const targetPoint = angleToPoint(target);
  const livePoint = angleToPoint(liveAngle);

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>Target: {target}° · Round {round + 1} of {targets.length}</Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <Svg width="100%" height={CANVAS_SIZE} viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`} role="img" accessibilityLabel="Angle matching triangle">
          <Line x1={CANVAS_ORIGIN_X} y1={CANVAS_ORIGIN_Y} x2={CANVAS_SIZE} y2={CANVAS_ORIGIN_Y} stroke={DL_COLORS.border} strokeWidth={1.5} />

          {/* static target triangle, muted lavender */}
          <Line x1={CANVAS_ORIGIN_X} y1={CANVAS_ORIGIN_Y} x2={targetPoint.x} y2={targetPoint.y} stroke={DL_COLORS.textMuted} strokeWidth={2} strokeDasharray="6,5" />
          <Line x1={targetPoint.x} y1={CANVAS_ORIGIN_Y} x2={targetPoint.x} y2={targetPoint.y} stroke={DL_COLORS.textMuted} strokeWidth={1.5} strokeDasharray="4,4" />

          {/* interactive triangle */}
          <Line
            x1={CANVAS_ORIGIN_X}
            y1={CANVAS_ORIGIN_Y}
            x2={livePoint.x}
            y2={livePoint.y}
            stroke={withinTolerance ? DL_COLORS.lime : DL_COLORS.amethyst}
            strokeWidth={4}
            strokeLinecap="round"
          />
          <Circle cx={livePoint.x} cy={livePoint.y} r={7} fill={withinTolerance ? DL_COLORS.lime : DL_COLORS.amethyst} />

          <SvgText x={CANVAS_ORIGIN_X + 26} y={CANVAS_ORIGIN_Y - 10} fontSize={12} fill={DL_COLORS.textMuted}>
            {Math.round(liveAngle)}°
          </SvgText>

          {effects.isBursting && (
            <ParticleBurst progress={effects.burstProgress} />
          )}
        </Svg>
        {holdProgress > 0 && (
          <View style={styles.holdTrack}>
            <View style={[styles.holdFill, { width: `${holdProgress * 100}%` }]} />
          </View>
        )}
      </ReAnimated.View>
      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={89}
        step={1}
        value={liveAngle}
        onValueChange={setLiveAngle}
        onSlidingComplete={handleSlidingComplete}
        minimumTrackTintColor={withinTolerance ? DL_COLORS.lime : DL_COLORS.amethyst}
        maximumTrackTintColor={DL_COLORS.surfaceMuted}
        thumbTintColor={withinTolerance ? DL_COLORS.lime : DL_COLORS.amethyst}
        accessibilityLabel="Angle slider"
      />
      <HintExplanationPanel hint={`Drag the slider until the arm lines up with the dashed target, then hold it steady within ±${STAGE1_TOLERANCE}° for 1.5s.`} feedback="idle" />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage 2 — Quantitative Mechanics: unit circle sin/cos alignment
// ---------------------------------------------------------------------------

const UNIT_CIRCLE_R = 100;
const UNIT_CIRCLE_SIZE = 260;
const UNIT_CIRCLE_CENTER = UNIT_CIRCLE_SIZE / 2;
const STAGE2_SIN_TOLERANCE = 0.03;
const STAGE2_HOLD_MS = 1200;

// Random target between 0.25 and 0.85 — avoids the near-degenerate cases
// close to 0 or 1 where the two symmetric solution angles nearly coincide.
function generateStage2Target(): number {
  return Math.round((0.25 + Math.random() * 0.6) * 100) / 100;
}

function Stage2QuantitativeMechanics({ onCommit, isActive }: StageCanvasProps) {
  const [sinTarget] = useState(generateStage2Target);
  const [liveAngle, setLiveAngle] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const effects = useSuccessEffects();

  const rad = toRad(liveAngle);
  const sinValue = Math.sin(rad);
  const cosValue = Math.cos(rad);

  // Checked against sin(theta) rather than the raw angle: sin(theta) and
  // sin(180-theta) are always equal, so this naturally treats either valid
  // target angle the same way instead of only recognizing one of them.
  const withinTolerance = Math.abs(sinValue - sinTarget) <= STAGE2_SIN_TOLERANCE;
  const wonRef = useRef(false);

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
      setHoldProgress(Math.min(1, elapsed / STAGE2_HOLD_MS));
      if (elapsed >= STAGE2_HOLD_MS) {
        holdStartRef.current = null;
        setHoldProgress(0);
        effects.trigger();
        wonRef.current = true;
        onCommit(1);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withinTolerance, isActive]);

  // A release that misses still gets evaluated so a near miss can surface
  // the encouragement banner, guarded against double-firing alongside a
  // hold-timer win that just happened. The slider gives back an angle —
  // convert to sin(theta) and report how close it was as a 0–1 score.
  function handleSlidingComplete(angleValue: number) {
    if (!wonRef.current) {
      const releasedSin = Math.sin(toRad(angleValue));
      const overshoot = Math.max(0, Math.abs(releasedSin - sinTarget) - STAGE2_SIN_TOLERANCE);
      onCommit(clampScore(1 - overshoot / STAGE2_SIN_TOLERANCE));
    }
    wonRef.current = false;
  }

  const tipX = UNIT_CIRCLE_CENTER + cosValue * UNIT_CIRCLE_R;
  const tipY = UNIT_CIRCLE_CENTER - sinValue * UNIT_CIRCLE_R;

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>Stop the vector where Sine (Y) = {sinTarget.toFixed(2)}</Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <Svg width="100%" height={UNIT_CIRCLE_SIZE} viewBox={`0 0 ${UNIT_CIRCLE_SIZE} ${UNIT_CIRCLE_SIZE}`} role="img" accessibilityLabel="Unit circle">
          <Line x1={0} y1={UNIT_CIRCLE_CENTER} x2={UNIT_CIRCLE_SIZE} y2={UNIT_CIRCLE_CENTER} stroke={DL_COLORS.border} strokeWidth={1.5} />
          <Line x1={UNIT_CIRCLE_CENTER} y1={0} x2={UNIT_CIRCLE_CENTER} y2={UNIT_CIRCLE_SIZE} stroke={DL_COLORS.border} strokeWidth={1.5} />
          <Circle cx={UNIT_CIRCLE_CENTER} cy={UNIT_CIRCLE_CENTER} r={UNIT_CIRCLE_R} fill="none" stroke={DL_COLORS.textMuted} strokeWidth={2} />

          {/* target sine line, ghosted */}
          <Line x1={0} y1={UNIT_CIRCLE_CENTER - sinTarget * UNIT_CIRCLE_R} x2={UNIT_CIRCLE_SIZE} y2={UNIT_CIRCLE_CENTER - sinTarget * UNIT_CIRCLE_R} stroke={DL_COLORS.amethystSoft} strokeWidth={2} strokeDasharray="5,5" />

          {/* projections */}
          <Line x1={UNIT_CIRCLE_CENTER} y1={UNIT_CIRCLE_CENTER} x2={tipX} y2={UNIT_CIRCLE_CENTER} stroke={DL_COLORS.amethyst} strokeWidth={4} strokeLinecap="round" />
          <Line x1={UNIT_CIRCLE_CENTER} y1={UNIT_CIRCLE_CENTER} x2={UNIT_CIRCLE_CENTER} y2={tipY} stroke={withinTolerance ? DL_COLORS.lime : DL_COLORS.amethyst} strokeWidth={4} strokeLinecap="round" />

          <Line x1={UNIT_CIRCLE_CENTER} y1={UNIT_CIRCLE_CENTER} x2={tipX} y2={tipY} stroke={withinTolerance ? DL_COLORS.lime : '#FFFFFF'} strokeWidth={2.5} />
          <Circle cx={tipX} cy={tipY} r={7} fill={withinTolerance ? DL_COLORS.lime : '#FFFFFF'} />

          {effects.isBursting && <ParticleBurst progress={effects.burstProgress} />}
        </Svg>
        {holdProgress > 0 && (
          <View style={styles.holdTrack}>
            <View style={[styles.holdFill, { width: `${holdProgress * 100}%`, backgroundColor: DL_COLORS.lime }]} />
          </View>
        )}
      </ReAnimated.View>

      <View style={styles.readoutRow}>
        <View style={styles.readoutTile}>
          <Text style={styles.readoutLabel}>Sine (Y)</Text>
          <Text style={[styles.readoutValue, { color: DL_COLORS.lime }]}>{sinValue.toFixed(3)}</Text>
        </View>
        <View style={styles.readoutTile}>
          <Text style={styles.readoutLabel}>Cosine (X)</Text>
          <Text style={[styles.readoutValue, { color: DL_COLORS.amethyst }]}>{cosValue.toFixed(3)}</Text>
        </View>
      </View>

      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={180}
        step={1}
        value={liveAngle}
        onValueChange={setLiveAngle}
        onSlidingComplete={handleSlidingComplete}
        minimumTrackTintColor={withinTolerance ? DL_COLORS.lime : DL_COLORS.amethyst}
        maximumTrackTintColor={DL_COLORS.surfaceMuted}
        thumbTintColor={withinTolerance ? DL_COLORS.lime : DL_COLORS.amethyst}
        accessibilityLabel="Vector angle dial"
      />
      <HintExplanationPanel
        hint={`θ = ${Math.round(liveAngle)}° — sin(θ) is the vertical (Y) coordinate on the unit circle. Try ${Math.round((Math.asin(sinTarget) * 180) / Math.PI)}° or ${180 - Math.round((Math.asin(sinTarget) * 180) / Math.PI)}°.`}
        feedback="idle"
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage 3 — Variables Challenge: hold the peak against a drifting variable
// ---------------------------------------------------------------------------

const STAGE3_TICK_MS = 30;
const STAGE3_HOLD_MS = 5000;

// Randomized within a band each playthrough for variety — safe to randomize
// freely since this stage only ever reports onCommit(1) on a win, never a
// raw value, so there's no engine target to desync from.
// Kept within a tight band around the originally-tuned (0.6, 0.95) pair —
// the combination of slowest speed + narrowest peak zone sets the worst-case
// time to clear this stage, so a wide random range here would make some
// playthroughs far grindier than others. This band's worst case matches the
// original fixed value's worst case exactly.
function generateStage3Difficulty(): { speedPerTick: number; peakThreshold: number } {
  return {
    speedPerTick: 0.55 + Math.random() * 0.2,
    peakThreshold: 0.93 + Math.random() * 0.02,
  };
}

function Stage3VariablesChallenge({ onCommit, isActive }: StageCanvasProps) {
  const [{ speedPerTick, peakThreshold }] = useState(generateStage3Difficulty);
  const [theta, setTheta] = useState(0);
  const [locking, setLocking] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  // theta drifts continuously and only stays near its peak for a fraction of
  // each revolution, so the 5s requirement is time ACCUMULATED across
  // however many passes it takes — not one unbroken hold, which the drift
  // speed would make impossible.
  const accumulatedMsRef = useRef(0);
  const segmentStartRef = useRef<number | null>(null);
  const effects = useSuccessEffects();

  // The independent variable drifts on its own — this is the "what happens as a variable fluctuates" test.
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => {
      setTheta((t) => (t + speedPerTick) % 360);
    }, STAGE3_TICK_MS);
    return () => clearInterval(id);
  }, [isActive, speedPerTick]);

  const sinValue = Math.sin(toRad(theta));
  const nearPeak = sinValue >= peakThreshold;
  const engaged = locking && nearPeak;

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

  const meterHeight = Math.max(0, sinValue) * 140;

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>Hold LOCK while sin(θ) stays near its peak — 5s straight.</Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <Svg width="100%" height={200} viewBox="0 0 260 200" role="img" accessibilityLabel="Peak meter">
          <Line x1={40} y1={20} x2={40} y2={180} stroke={DL_COLORS.border} strokeWidth={1.5} />
          <Line x1={20} y1={180 - peakThreshold * 140} x2={220} y2={180 - peakThreshold * 140} stroke={DL_COLORS.amethystSoft} strokeWidth={2} strokeDasharray="5,5" />
          <Path
            d={`M20,${180 - meterHeight} L60,${180 - meterHeight} L60,180 L20,180 Z`}
            fill={engaged ? DL_COLORS.lime : nearPeak ? DL_COLORS.amethyst : DL_COLORS.surfaceMuted}
          />
          <SvgText x={130} y={40} fontSize={13} fill={DL_COLORS.textMuted} textAnchor="middle">θ = {Math.round(theta)}°</SvgText>
          <SvgText x={130} y={60} fontSize={20} fontWeight="bold" fill={engaged ? DL_COLORS.lime : DL_COLORS.text} textAnchor="middle">
            sin(θ) = {sinValue.toFixed(3)}
          </SvgText>
          {effects.isBursting && <ParticleBurst progress={effects.burstProgress} />}
        </Svg>
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
        accessibilityLabel="Hold at peak"
        style={[styles.lockButton, engaged && styles.lockButtonEngaged]}
      >
        <Text style={styles.lockButtonText}>{locking ? (nearPeak ? '🔒 Locked in!' : '🔓 Not yet…') : '🔒 HOLD AT PEAK'}</Text>
      </Pressable>
      <HintExplanationPanel hint={`θ drifts on its own — press and hold right as sin(θ) crosses ${peakThreshold.toFixed(2)}, its peak zone.`} feedback="idle" />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage 4 — Mastery Sandbox: duplicate the target wave
// ---------------------------------------------------------------------------

interface WaveParams {
  amplitude: number;
  frequency: number;
  phase: number;
}

const WAVE_SAMPLES = 36;
const WAVE_W = 280;
const WAVE_H = 180;
const WAVE_PAD = 16;
const STAGE4_START: WaveParams = { amplitude: 1, frequency: 1, phase: 0 };

function waveValue(x: number, amp: number, freq: number, phaseDeg: number) {
  return amp * Math.sin(toRad(x * freq + phaseDeg));
}

function buildWavePath(amp: number, freq: number, phaseDeg: number) {
  const plotW = WAVE_W - WAVE_PAD * 2;
  const plotH = WAVE_H - WAVE_PAD * 2;
  const points = Array.from({ length: WAVE_SAMPLES + 1 }, (_, i) => {
    const x = (i / WAVE_SAMPLES) * 360;
    const y = waveValue(x, amp, freq, phaseDeg);
    return {
      sx: WAVE_PAD + (i / WAVE_SAMPLES) * plotW,
      sy: WAVE_PAD + plotH / 2 - y * (plotH / 2 / 1.5),
    };
  });
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.sx},${p.sy}`).join(' ');
}

function computeMatchPercent(amp: number, freq: number, phaseDeg: number, target: WaveParams) {
  let totalDiff = 0;
  for (let i = 0; i <= WAVE_SAMPLES; i++) {
    const x = (i / WAVE_SAMPLES) * 360;
    const targetY = waveValue(x, target.amplitude, target.frequency, target.phase);
    const mine = waveValue(x, amp, freq, phaseDeg);
    totalDiff += Math.abs(targetY - mine);
  }
  const avgDiff = totalDiff / (WAVE_SAMPLES + 1);
  const match = 100 * (1 - avgDiff / 1.5);
  return Math.max(0, Math.min(100, match));
}

// Randomized each playthrough, but re-rolled if it would happen to already
// match the sliders' fixed starting position — a boss level should never
// win itself before the player touches anything.
function generateWaveTarget(): WaveParams {
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate: WaveParams = {
      amplitude: Math.round((0.4 + Math.random() * 0.9) * 100) / 100,
      frequency: Math.round((1.2 + Math.random() * 1.6) * 100) / 100,
      phase: randomInt(10, 350),
    };
    const startingMatch = computeMatchPercent(STAGE4_START.amplitude, STAGE4_START.frequency, STAGE4_START.phase, candidate);
    if (startingMatch < 80) return candidate;
  }
  return { amplitude: 0.7, frequency: 2, phase: 30 };
}

function Stage4MasterySandbox({ onCommit, isActive }: StageCanvasProps) {
  const [target] = useState(generateWaveTarget);
  const [amplitude, setAmplitude] = useState(STAGE4_START.amplitude);
  const [frequency, setFrequency] = useState(STAGE4_START.frequency);
  const [phase, setPhase] = useState(STAGE4_START.phase);
  const effects = useSuccessEffects();
  const wonRef = useRef(false);

  const matchPercent = computeMatchPercent(amplitude, frequency, phase, target);

  useEffect(() => {
    if (!isActive || wonRef.current) return;
    if (matchPercent >= 95) {
      wonRef.current = true;
      effects.trigger();
      onCommit(matchPercent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchPercent, isActive]);

  const targetPath = useMemo(() => buildWavePath(target.amplitude, target.frequency, target.phase), [target]);
  const mineePath = buildWavePath(amplitude, frequency, phase);

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>Boss level: duplicate the target wave — 95% match to win.</Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <Svg width="100%" height={WAVE_H} viewBox={`0 0 ${WAVE_W} ${WAVE_H}`} role="img" accessibilityLabel="Wave matching puzzle">
          <Line x1={WAVE_PAD} y1={WAVE_H / 2} x2={WAVE_W - WAVE_PAD} y2={WAVE_H / 2} stroke={DL_COLORS.border} strokeWidth={1} />
          <Path d={targetPath} fill="none" stroke={DL_COLORS.textMuted} strokeWidth={2.5} strokeDasharray="6,5" />
          <Path d={mineePath} fill="none" stroke={matchPercent >= 95 ? DL_COLORS.lime : DL_COLORS.amethyst} strokeWidth={3} strokeLinecap="round" />
          {effects.isBursting && <ParticleBurst progress={effects.burstProgress} />}
        </Svg>
      </ReAnimated.View>

      <View style={styles.matchRow}>
        <Text style={styles.stageHint}>Match: </Text>
        <Text style={[styles.matchValue, { color: matchPercent >= 95 ? DL_COLORS.lime : DL_COLORS.amethyst }]}>
          {matchPercent.toFixed(1)}%
        </Text>
      </View>

      <Text style={styles.sliderLabel}>Amplitude: {amplitude.toFixed(2)}</Text>
      <Slider style={styles.slider} minimumValue={0.2} maximumValue={1.5} step={0.01} value={amplitude} onValueChange={setAmplitude} minimumTrackTintColor={DL_COLORS.amethyst} maximumTrackTintColor={DL_COLORS.surfaceMuted} thumbTintColor={DL_COLORS.amethyst} />

      <Text style={styles.sliderLabel}>Frequency: {frequency.toFixed(2)}</Text>
      <Slider style={styles.slider} minimumValue={0.5} maximumValue={3} step={0.01} value={frequency} onValueChange={setFrequency} minimumTrackTintColor={DL_COLORS.amethyst} maximumTrackTintColor={DL_COLORS.surfaceMuted} thumbTintColor={DL_COLORS.amethyst} />

      <Text style={styles.sliderLabel}>Phase: {Math.round(phase)}°</Text>
      <Slider style={styles.slider} minimumValue={0} maximumValue={360} step={1} value={phase} onValueChange={setPhase} minimumTrackTintColor={DL_COLORS.amethyst} maximumTrackTintColor={DL_COLORS.surfaceMuted} thumbTintColor={DL_COLORS.amethyst} />
      <HintExplanationPanel hint="Amplitude sets the wave's height, frequency sets how many peaks fit in one cycle, and phase shifts it left or right." feedback="idle" />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage config + top-level module
// ---------------------------------------------------------------------------

function buildTrigStages(): MathStageConfig[] {
  return [
    {
      id: 'foundations',
      title: 'Foundations',
      objective: 'Match the target angle using visual intuition alone.',
      targetValue: 1,
      baseXp: 20,
      toleranceThreshold: 0,
      nearMiss: { thresholdPercent: 60, message: 'In touching distance! Nudge it a hair closer.' },
      checkWinCondition: (value, target) => value >= target,
      renderCanvas: Stage1Foundations,
      skill: 'angle fundamentals',
      fastClearMs: 30000,
    },
    {
      id: 'quantitative',
      title: 'Quantitative Mechanics',
      objective: 'Align sine and cosine on the unit circle grid.',
      targetValue: 1,
      baseXp: 40,
      toleranceThreshold: 0,
      nearMiss: { thresholdPercent: 50, message: 'So close — the sine value is almost exactly right!' },
      checkWinCondition: (value, target) => value >= target,
      renderCanvas: Stage2QuantitativeMechanics,
      skill: 'trigonometric ratios',
      fastClearMs: 25000,
    },
    {
      id: 'variables',
      title: 'The Variables Challenge',
      objective: 'Hold the dependent variable at its peak as it fluctuates.',
      targetValue: 1,
      baseXp: 60,
      toleranceThreshold: 0.001,
      checkWinCondition: (value, target, tolerance) => Math.abs(value - target) <= tolerance,
      renderCanvas: Stage3VariablesChallenge,
      skill: 'unit-circle relationships',
      fastClearMs: 30000,
    },
    {
      id: 'mastery',
      title: 'Mastery Sandbox',
      objective: 'Freely tune every parameter to duplicate the target wave.',
      targetValue: 95,
      baseXp: 100,
      toleranceThreshold: 0,
      checkWinCondition: (value, target) => value >= target,
      renderCanvas: Stage4MasterySandbox,
      skill: 'applied trigonometry (waveforms)',
      fastClearMs: 40000,
    },
  ];
}

export default function TrigonometryGameModule({ onNextRealm }: { onNextRealm?: () => void }) {
  const [playthrough, setPlaythrough] = useState(0);
  const stages = useMemo(buildTrigStages, [playthrough]);
  return (
    <DeepLearningGameScreen
      key={playthrough}
      stages={stages}
      maxXp={220}
      realmId="trigonometry"
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
    paddingVertical: 6,
  },
  holdTrack: {
    width: '90%',
    height: 6,
    borderRadius: 999,
    backgroundColor: DL_COLORS.surfaceMuted,
    marginBottom: 10,
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
  readoutRow: {
    flexDirection: 'row',
    gap: 10,
  },
  readoutTile: {
    flex: 1,
    backgroundColor: DL_COLORS.surface,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: DL_COLORS.border,
    padding: 10,
    alignItems: 'center',
  },
  readoutLabel: {
    fontSize: 11,
    color: DL_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  readoutValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  lockButton: {
    backgroundColor: DL_COLORS.surfaceMuted,
    borderWidth: 2,
    borderColor: DL_COLORS.amethyst,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  lockButtonEngaged: {
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
    gap: 4,
  },
  matchValue: {
    fontSize: 18,
    fontWeight: '800',
  },
});
