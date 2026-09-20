import Slider from '@react-native-community/slider';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import ReAnimated from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { DeepLearningProvider, useDeepLearning } from '../src/features/deep-learning/DeepLearningContext';
import LevelSelector from '../src/features/deep-learning/LevelSelector';
import { DL_COLORS } from '../src/features/deep-learning/theme';
import type { MathStageConfig, StageCanvasProps } from '../src/features/deep-learning/types';
import { ParticleBurst, useSuccessEffects } from '../src/features/deep-learning/useSuccessEffects';

const toRad = (deg: number) => (deg * Math.PI) / 180;

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function ProgressHeader() {
  const { xpEarned, streakCount } = useDeepLearning();
  const maxXp = 220; // sum of all four stages' base XP (20+40+60+100), a sensible bar ceiling
  const pct = Math.min(100, (xpEarned / maxXp) * 100);
  const isHot = streakCount >= 3;

  return (
    <View style={styles.progressHeader}>
      <View style={styles.progressRow}>
        <View style={styles.xpBarTrack}>
          <View style={[styles.xpBarFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.xpLabel}>{xpEarned} XP</Text>
      </View>
      {streakCount > 0 && (
        <View style={[styles.streakBadge, isHot && styles.streakBadgeHot]}>
          <Text style={styles.streakText}>{isHot ? '🔥' : '✦'} {streakCount}x streak</Text>
        </View>
      )}
    </View>
  );
}

function NearMissBanner() {
  const { isNearMiss, nearMissMessage } = useDeepLearning();
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isNearMiss) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 500, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 500, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isNearMiss, glow]);

  if (!isNearMiss || !nearMissMessage) return null;

  const borderColor = glow.interpolate({ inputRange: [0, 1], outputRange: [DL_COLORS.amethystSoft, DL_COLORS.amethyst] });

  return (
    <Animated.View style={[styles.nearMissBanner, { borderColor }]}>
      <Text style={styles.nearMissText}>💡 {nearMissMessage}</Text>
    </Animated.View>
  );
}

function StageCompleteBanner({ visible, isFinalStage, onContinue }: { visible: boolean; isFinalStage: boolean; onContinue: () => void }) {
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slide, { toValue: visible ? 1 : 0, useNativeDriver: true, friction: 7 }).start();
  }, [visible, slide]);

  if (!visible) return null;

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });

  return (
    <Animated.View style={[styles.completeBanner, { opacity: slide, transform: [{ translateY }] }]}>
      <Text style={styles.completeEmoji}>{isFinalStage ? '🏆' : '⚡'}</Text>
      <Text style={styles.completeTitle}>{isFinalStage ? 'Module Mastered!' : 'Stage Cleared!'}</Text>
      <Pressable style={styles.continueButton} onPress={onContinue}>
        <Text style={styles.continueButtonText}>{isFinalStage ? 'Finish' : 'Continue ➔'}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Stage 1 — Foundations: match the target angle by feel
// ---------------------------------------------------------------------------

const STAGE1_TARGETS = [30, 45, 70];
const STAGE1_TOLERANCE = 2;
const STAGE1_HOLD_MS = 1500;
const CANVAS_SIZE = 260;
const CANVAS_ORIGIN_X = 40;
const CANVAS_ORIGIN_Y = 220;
const ARM_LENGTH = 170;

function angleToPoint(angleDeg: number) {
  const rad = toRad(angleDeg);
  return {
    x: CANVAS_ORIGIN_X + Math.cos(rad) * ARM_LENGTH,
    y: CANVAS_ORIGIN_Y - Math.sin(rad) * ARM_LENGTH,
  };
}

function Stage1Foundations({ onCommit, isActive }: StageCanvasProps) {
  const [round, setRound] = useState(0);
  const [liveAngle, setLiveAngle] = useState(20);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  // Guards against double-submitting the final round: the hold-timer and a
  // slider release can both fire in quick succession for the same attempt.
  const finalRoundWonRef = useRef(false);
  const effects = useSuccessEffects();

  const isFinalRound = round === STAGE1_TARGETS.length - 1;
  const target = STAGE1_TARGETS[round];
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
          onCommit(liveAngle);
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
      onCommit(value);
    }
  }

  const targetPoint = angleToPoint(target);
  const livePoint = angleToPoint(liveAngle);

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>Target: {target}° · Round {round + 1} of {STAGE1_TARGETS.length}</Text>
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
      <Text style={styles.stageHint}>Hold the angle steady within ±{STAGE1_TOLERANCE}° for 1.5s to lock it in.</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage 2 — Quantitative Mechanics: unit circle sin/cos alignment
// ---------------------------------------------------------------------------

const UNIT_CIRCLE_R = 100;
const UNIT_CIRCLE_SIZE = 260;
const UNIT_CIRCLE_CENTER = UNIT_CIRCLE_SIZE / 2;
const STAGE2_TARGETS = [30, 150]; // both give sin = 0.5, shown to the student
const STAGE2_SIN_TARGET = 0.5;
const STAGE2_SIN_TOLERANCE = 0.03; // roughly equivalent to ±2 degrees near 30°/150°
const STAGE2_HOLD_MS = 1200;

function Stage2QuantitativeMechanics({ onCommit, isActive }: StageCanvasProps) {
  const [liveAngle, setLiveAngle] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const effects = useSuccessEffects();

  const rad = toRad(liveAngle);
  const sinValue = Math.sin(rad);
  const cosValue = Math.cos(rad);

  // Checked against sin(theta) rather than the raw angle: sin(30°) and
  // sin(150°) are both exactly 0.5, so this naturally treats either valid
  // target the same way instead of only recognizing whichever one a fixed
  // "targetValue" happened to point at.
  const withinTolerance = Math.abs(sinValue - STAGE2_SIN_TARGET) <= STAGE2_SIN_TOLERANCE;
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
        onCommit(sinValue);
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
  // convert to sin(theta) before handing it to the engine.
  function handleSlidingComplete(angleValue: number) {
    if (!wonRef.current) {
      onCommit(Math.sin(toRad(angleValue)));
    }
    wonRef.current = false;
  }

  const tipX = UNIT_CIRCLE_CENTER + cosValue * UNIT_CIRCLE_R;
  const tipY = UNIT_CIRCLE_CENTER - sinValue * UNIT_CIRCLE_R;

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>Stop the vector where Sine (Y) = 0.5</Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <Svg width="100%" height={UNIT_CIRCLE_SIZE} viewBox={`0 0 ${UNIT_CIRCLE_SIZE} ${UNIT_CIRCLE_SIZE}`} role="img" accessibilityLabel="Unit circle">
          <Line x1={0} y1={UNIT_CIRCLE_CENTER} x2={UNIT_CIRCLE_SIZE} y2={UNIT_CIRCLE_CENTER} stroke={DL_COLORS.border} strokeWidth={1.5} />
          <Line x1={UNIT_CIRCLE_CENTER} y1={0} x2={UNIT_CIRCLE_CENTER} y2={UNIT_CIRCLE_SIZE} stroke={DL_COLORS.border} strokeWidth={1.5} />
          <Circle cx={UNIT_CIRCLE_CENTER} cy={UNIT_CIRCLE_CENTER} r={UNIT_CIRCLE_R} fill="none" stroke={DL_COLORS.textMuted} strokeWidth={2} />

          {/* target sine line, ghosted */}
          <Line x1={0} y1={UNIT_CIRCLE_CENTER - 0.5 * UNIT_CIRCLE_R} x2={UNIT_CIRCLE_SIZE} y2={UNIT_CIRCLE_CENTER - 0.5 * UNIT_CIRCLE_R} stroke={DL_COLORS.amethystSoft} strokeWidth={2} strokeDasharray="5,5" />

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
      <Text style={styles.stageHint}>θ = {Math.round(liveAngle)}° — try 30° or 150°.</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage 3 — Variables Challenge: hold the peak against a drifting variable
// ---------------------------------------------------------------------------

const STAGE3_SPEED_DEG_PER_TICK = 0.6;
const STAGE3_TICK_MS = 30;
const STAGE3_PEAK_THRESHOLD = 0.95; // sin(theta) must stay above this
const STAGE3_HOLD_MS = 5000;

function Stage3VariablesChallenge({ onCommit, isActive }: StageCanvasProps) {
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
      setTheta((t) => (t + STAGE3_SPEED_DEG_PER_TICK) % 360);
    }, STAGE3_TICK_MS);
    return () => clearInterval(id);
  }, [isActive]);

  const sinValue = Math.sin(toRad(theta));
  const nearPeak = sinValue >= STAGE3_PEAK_THRESHOLD;
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
          <Line x1={20} y1={180 - STAGE3_PEAK_THRESHOLD * 140} x2={220} y2={180 - STAGE3_PEAK_THRESHOLD * 140} stroke={DL_COLORS.amethystSoft} strokeWidth={2} strokeDasharray="5,5" />
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
        style={[styles.lockButton, engaged && styles.lockButtonEngaged]}
      >
        <Text style={styles.lockButtonText}>{locking ? (nearPeak ? '🔒 Locked in!' : '🔓 Not yet…') : '🔒 HOLD AT PEAK'}</Text>
      </Pressable>
      <Text style={styles.stageHint}>θ drifts on its own — press and hold right as sin(θ) crosses {STAGE3_PEAK_THRESHOLD}.</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage 4 — Mastery Sandbox: duplicate the target wave
// ---------------------------------------------------------------------------

const WAVE_TARGET = { amplitude: 0.7, frequency: 2, phase: 30 };
const WAVE_SAMPLES = 36;
const WAVE_W = 280;
const WAVE_H = 180;
const WAVE_PAD = 16;

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

function computeMatchPercent(amp: number, freq: number, phaseDeg: number) {
  let totalDiff = 0;
  for (let i = 0; i <= WAVE_SAMPLES; i++) {
    const x = (i / WAVE_SAMPLES) * 360;
    const target = waveValue(x, WAVE_TARGET.amplitude, WAVE_TARGET.frequency, WAVE_TARGET.phase);
    const mine = waveValue(x, amp, freq, phaseDeg);
    totalDiff += Math.abs(target - mine);
  }
  const avgDiff = totalDiff / (WAVE_SAMPLES + 1);
  const match = 100 * (1 - avgDiff / 1.5);
  return Math.max(0, Math.min(100, match));
}

function Stage4MasterySandbox({ onCommit, isActive }: StageCanvasProps) {
  const [amplitude, setAmplitude] = useState(1);
  const [frequency, setFrequency] = useState(1);
  const [phase, setPhase] = useState(0);
  const effects = useSuccessEffects();
  const wonRef = useRef(false);

  const matchPercent = computeMatchPercent(amplitude, frequency, phase);

  useEffect(() => {
    if (!isActive || wonRef.current) return;
    if (matchPercent >= 95) {
      wonRef.current = true;
      effects.trigger();
      onCommit(matchPercent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchPercent, isActive]);

  const targetPath = useMemo(() => buildWavePath(WAVE_TARGET.amplitude, WAVE_TARGET.frequency, WAVE_TARGET.phase), []);
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
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage config + top-level module
// ---------------------------------------------------------------------------

const TRIG_STAGES: MathStageConfig[] = [
  {
    id: 'foundations',
    title: 'Foundations',
    objective: 'Match the target angle using visual intuition alone.',
    targetValue: STAGE1_TARGETS[STAGE1_TARGETS.length - 1],
    baseXp: 20,
    toleranceThreshold: STAGE1_TOLERANCE,
    nearMiss: { thresholdPercent: 8, message: 'In touching distance! Nudge it a hair closer.' },
    checkWinCondition: (value, target, tolerance) => Math.abs(value - target) <= tolerance,
    renderCanvas: Stage1Foundations,
  },
  {
    id: 'quantitative',
    title: 'Quantitative Mechanics',
    objective: 'Align sine and cosine on the unit circle grid.',
    // Checked in sin(theta)-space, not degrees — sin(30°) and sin(150°) are
    // both exactly 0.5, so this treats either valid angle identically. See
    // Stage2QuantitativeMechanics for the angle -> sin conversion.
    targetValue: STAGE2_SIN_TARGET,
    baseXp: 40,
    toleranceThreshold: STAGE2_SIN_TOLERANCE,
    nearMiss: { thresholdPercent: 15, message: 'So close — the sine value is almost exactly 0.5!' },
    checkWinCondition: (value, target, tolerance) => Math.abs(value - target) <= tolerance,
    renderCanvas: Stage2QuantitativeMechanics,
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
  },
];

function TrigGameInner() {
  const { stages, activeStageIndex, activeStage, unlockedStages, submitInput, goToStage, lastResult } = useDeepLearning();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (lastResult === 'won') setShowBanner(true);
  }, [lastResult, activeStageIndex]);

  const isFinalStage = activeStageIndex === stages.length - 1;

  function handleContinue() {
    setShowBanner(false);
    if (!isFinalStage) goToStage(activeStageIndex + 1);
  }

  const StageCanvas = activeStage.renderCanvas;

  return (
    <View style={styles.gameContainer}>
      <ProgressHeader />
      <LevelSelector stages={stages} activeStageIndex={activeStageIndex} unlockedStages={unlockedStages} onSelectStage={goToStage} />
      <Text style={styles.stageTitle}>{activeStage.title}</Text>
      <NearMissBanner />
      {!showBanner && (
        <StageCanvas
          value={0}
          onChangeValue={() => {}}
          onCommit={submitInput}
          target={activeStage.targetValue}
          tolerance={activeStage.toleranceThreshold}
          isNearMiss={false}
          nearMissMessage={null}
          isActive
        />
      )}
      <StageCompleteBanner visible={showBanner} isFinalStage={isFinalStage} onContinue={handleContinue} />
    </View>
  );
}

export default function TrigonometryGameModule() {
  return (
    <DeepLearningProvider stages={TRIG_STAGES}>
      <View style={styles.root}>
        <TrigGameInner />
      </View>
    </DeepLearningProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: DL_COLORS.bgDeep,
  },
  gameContainer: {
    padding: 14,
    paddingBottom: 32,
  },
  progressHeader: {
    marginBottom: 4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  xpBarTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: DL_COLORS.surfaceMuted,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: DL_COLORS.lime,
    shadowColor: DL_COLORS.lime,
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },
  xpLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: DL_COLORS.lime,
    minWidth: 58,
    textAlign: 'right',
  },
  streakBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: DL_COLORS.surfaceMuted,
  },
  streakBadgeHot: {
    backgroundColor: DL_COLORS.limeSoft,
    shadowColor: DL_COLORS.lime,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '800',
    color: DL_COLORS.lime,
  },
  stageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DL_COLORS.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  nearMissBanner: {
    borderWidth: 2,
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    backgroundColor: DL_COLORS.surface,
  },
  nearMissText: {
    color: DL_COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
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
  completeBanner: {
    backgroundColor: DL_COLORS.limeSoft,
    borderWidth: 2,
    borderColor: DL_COLORS.lime,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    shadowColor: DL_COLORS.lime,
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  completeEmoji: {
    fontSize: 44,
  },
  completeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: DL_COLORS.lime,
  },
  continueButton: {
    backgroundColor: DL_COLORS.lime,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 10,
    marginTop: 4,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: DL_COLORS.bgDeep,
  },
});
