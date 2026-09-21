import Slider from '@react-native-community/slider';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ReAnimated from 'react-native-reanimated';
import Svg, { Circle as SvgCircle, Line, Rect } from 'react-native-svg';
import { useDeepLearning } from '../src/features/deep-learning/DeepLearningContext';
import { DeepLearningGameScreen } from '../src/features/deep-learning/GameChrome';
import { HintExplanationPanel } from '../src/features/deep-learning/HintExplanationPanel';
import { clampScore, randomInt, scoreAgainst } from '../src/features/deep-learning/mathUtils';
import { EntryDisplay, NumericKeypad } from '../src/features/deep-learning/NumericKeypad';
import { DL_COLORS } from '../src/features/deep-learning/theme';
import type { MathStageConfig, StageCanvasProps } from '../src/features/deep-learning/types';
import { ParticleBurst, useSuccessEffects } from '../src/features/deep-learning/useSuccessEffects';

// ---------------------------------------------------------------------------
// Stage 1 — Foundations: "Blueprint Match", resize a room to match a plan
// ---------------------------------------------------------------------------

const STAGE1_TOLERANCE = 0.5;
const STAGE1_HOLD_MS = 1200;
const CANVAS_SIZE = 220;
const SCALE = 16;
const ORIGIN_X = 40;
const ORIGIN_Y = 190;

function generateStage1Rooms(): { width: number; height: number }[] {
  return Array.from({ length: 3 }, () => ({ width: randomInt(4, 11), height: randomInt(3, 9) }));
}

function Stage1Foundations({ onCommit, isActive }: StageCanvasProps) {
  const [rooms] = useState(generateStage1Rooms);
  const [round, setRound] = useState(0);
  const [liveWidth, setLiveWidth] = useState(3);
  const [liveHeight, setLiveHeight] = useState(3);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const finalRoundWonRef = useRef(false);
  const effects = useSuccessEffects();

  const isFinalRound = round === rooms.length - 1;
  const target = rooms[round];
  const withinTolerance =
    Math.abs(liveWidth - target.width) <= STAGE1_TOLERANCE && Math.abs(liveHeight - target.height) <= STAGE1_TOLERANCE;

  useEffect(() => {
    finalRoundWonRef.current = false;
    setLiveWidth(3);
    setLiveHeight(3);
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
      const errW = Math.max(0, Math.abs(liveWidth - target.width) - STAGE1_TOLERANCE);
      const errH = Math.max(0, Math.abs(liveHeight - target.height) - STAGE1_TOLERANCE);
      onCommit(clampScore(1 - (errW + errH) / (2 * STAGE1_TOLERANCE)));
    }
  }

  const targetW = target.width * SCALE;
  const targetH = target.height * SCALE;
  const liveW = liveWidth * SCALE;
  const liveH = liveHeight * SCALE;

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>
        Round {round + 1} of {rooms.length} · blueprint calls for a {target.width}×{target.height} room
      </Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <Svg width="100%" height={CANVAS_SIZE} viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`} role="img" accessibilityLabel="Blueprint room diagram">
          <Line x1={ORIGIN_X} y1={ORIGIN_Y} x2={CANVAS_SIZE} y2={ORIGIN_Y} stroke={DL_COLORS.border} strokeWidth={1.5} />
          <Line x1={ORIGIN_X} y1={20} x2={ORIGIN_X} y2={ORIGIN_Y} stroke={DL_COLORS.border} strokeWidth={1.5} />

          {/* target blueprint outline */}
          <Rect
            x={ORIGIN_X}
            y={ORIGIN_Y - targetH}
            width={targetW}
            height={targetH}
            fill="none"
            stroke={DL_COLORS.textMuted}
            strokeWidth={2}
            strokeDasharray="6,5"
          />

          {/* the room the student is resizing */}
          <Rect
            x={ORIGIN_X}
            y={ORIGIN_Y - liveH}
            width={liveW}
            height={liveH}
            fill={withinTolerance ? DL_COLORS.limeSoft : DL_COLORS.amethystSoft}
            stroke={withinTolerance ? DL_COLORS.lime : DL_COLORS.amethyst}
            strokeWidth={3}
          />

          {effects.isBursting && <ParticleBurst progress={effects.burstProgress} />}
        </Svg>
        {holdProgress > 0 && (
          <View style={styles.holdTrack}>
            <View style={[styles.holdFill, { width: `${holdProgress * 100}%` }]} />
          </View>
        )}
      </ReAnimated.View>

      <Text style={styles.sliderLabel}>Width: {liveWidth.toFixed(1)}</Text>
      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={12}
        step={0.1}
        value={liveWidth}
        onValueChange={setLiveWidth}
        onSlidingComplete={handleRelease}
        minimumTrackTintColor={withinTolerance ? DL_COLORS.lime : DL_COLORS.amethyst}
        maximumTrackTintColor={DL_COLORS.surfaceMuted}
        thumbTintColor={withinTolerance ? DL_COLORS.lime : DL_COLORS.amethyst}
        accessibilityLabel="Room width"
      />
      <Text style={styles.sliderLabel}>Height: {liveHeight.toFixed(1)}</Text>
      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={12}
        step={0.1}
        value={liveHeight}
        onValueChange={setLiveHeight}
        onSlidingComplete={handleRelease}
        minimumTrackTintColor={withinTolerance ? DL_COLORS.lime : DL_COLORS.amethyst}
        maximumTrackTintColor={DL_COLORS.surfaceMuted}
        thumbTintColor={withinTolerance ? DL_COLORS.lime : DL_COLORS.amethyst}
        accessibilityLabel="Room height"
      />
      <HintExplanationPanel hint="Drag both sliders until the solid room lines up with the dashed blueprint, then hold it steady." feedback="idle" />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage 2 — Quantitative Mechanics: real jobs that need area & perimeter
// ---------------------------------------------------------------------------

interface GeometryProblem {
  prompt: string;
  answer: number;
  hint: string;
  explanation: string;
}

function generateStage2Problems(): GeometryProblem[] {
  const rectW = randomInt(3, 9);
  const rectH = randomInt(2, 8);
  const triSide = randomInt(5, 15);
  const circleR = randomInt(3, 10);
  return [
    {
      prompt: `A rectangular garden is ${rectW} units by ${rectH} units. How many units of fencing (the perimeter) do you need to enclose it?`,
      answer: 2 * (rectW + rectH),
      hint: 'A rectangle’s perimeter is twice the width plus twice the height.',
      explanation: `2 × (${rectW} + ${rectH}) = ${2 * (rectW + rectH)}.`,
    },
    {
      prompt: `A triangular pennant flag has three ${triSide}-unit sides. How many units of trim (the perimeter) does it need?`,
      answer: 3 * triSide,
      hint: 'Perimeter is just the sum of all the sides.',
      explanation: `${triSide} + ${triSide} + ${triSide} = ${3 * triSide}.`,
    },
    {
      prompt: `A circular pool has a ${circleR}-unit radius. Rounded to the nearest whole number, how many square units of tile cover it?`,
      answer: Math.round(Math.PI * circleR * circleR),
      hint: 'A circle’s area is π × radius².',
      explanation: `π × ${circleR}² ≈ ${Math.round(Math.PI * circleR * circleR)}.`,
    },
  ];
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
    if (value === problem.answer) {
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
      if (isFinalRound) onCommit(scoreAgainst(value, problem.answer));
      setTimeout(() => {
        setEntry('');
        setFeedback('idle');
      }, 500);
    }
  }

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>Round {round + 1} of {problems.length} · real jobs that need geometry</Text>
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
        hint={problem.hint}
        explanation={feedback !== 'idle' ? problem.explanation : null}
        feedback={feedback === 'idle' ? 'idle' : feedback === 'correct' ? 'correct' : isFinalRound && isNearMiss ? 'nearMiss' : 'wrong'}
        disabled={feedback !== 'idle'}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage 3 — Variables Challenge: "Fence Optimizer" — max area, fixed perimeter
// ---------------------------------------------------------------------------

const STAGE3_HOLD_MS = 1200;

// Each round's win threshold is 95% of that perimeter's true maximum area
// (P/4)² — computed directly from the randomized perimeter, so it's always
// exactly as achievable regardless of what perimeters come up.
function generateStage3Rounds(): { perimeter: number; winThreshold: number }[] {
  const perimeters = [randomInt(30, 44), randomInt(50, 70)];
  return perimeters.map((perimeter) => ({ perimeter, winThreshold: 0.95 * (perimeter / 4) ** 2 }));
}

function Stage3FenceOptimizer({ onCommit, isActive }: StageCanvasProps) {
  const [rounds] = useState(generateStage3Rounds);
  const [round, setRound] = useState(0);
  const [width, setWidth] = useState(2);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const finalRoundWonRef = useRef(false);
  const effects = useSuccessEffects();

  const isFinalRound = round === rounds.length - 1;
  const goal = rounds[round];
  const halfPerimeter = goal.perimeter / 2;
  const height = halfPerimeter - width;
  const area = width * height;
  const maxArea = (goal.perimeter / 4) ** 2;
  const atMax = area >= goal.winThreshold;

  useEffect(() => {
    finalRoundWonRef.current = false;
    setWidth(2);
  }, [round]);

  useEffect(() => {
    if (!isActive) return;
    if (!atMax) {
      holdStartRef.current = null;
      setHoldProgress(0);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    if (holdStartRef.current === null) holdStartRef.current = Date.now();

    function tick() {
      const elapsed = Date.now() - (holdStartRef.current ?? Date.now());
      setHoldProgress(Math.min(1, elapsed / STAGE3_HOLD_MS));
      if (elapsed >= STAGE3_HOLD_MS) {
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
  }, [atMax, isActive, round]);

  function handleRelease() {
    if (isFinalRound && !finalRoundWonRef.current) onCommit(clampScore(area / goal.winThreshold));
  }

  const plotScale = 3.2;

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>
        Round {round + 1} of {rounds.length} · exactly {goal.perimeter}ft of fencing — find the biggest garden
      </Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <Svg width="100%" height={160} viewBox="0 0 260 160" role="img" accessibilityLabel="Fenced garden diagram">
          <Rect
            x={130 - (width * plotScale) / 2}
            y={80 - (height * plotScale) / 2}
            width={width * plotScale}
            height={height * plotScale}
            fill={atMax ? DL_COLORS.limeSoft : DL_COLORS.amethystSoft}
            stroke={atMax ? DL_COLORS.lime : DL_COLORS.amethyst}
            strokeWidth={3}
          />
          {effects.isBursting && <ParticleBurst progress={effects.burstProgress} />}
        </Svg>
        <View style={styles.readoutRow}>
          <View style={styles.readoutTile}>
            <Text style={styles.readoutLabel}>Width</Text>
            <Text style={styles.readoutValue}>{width.toFixed(1)}</Text>
          </View>
          <View style={styles.readoutTile}>
            <Text style={styles.readoutLabel}>Height</Text>
            <Text style={styles.readoutValue}>{height.toFixed(1)}</Text>
          </View>
          <View style={styles.readoutTile}>
            <Text style={styles.readoutLabel}>Area</Text>
            <Text style={[styles.readoutValue, { color: atMax ? DL_COLORS.lime : DL_COLORS.amethyst }]}>{area.toFixed(1)}</Text>
          </View>
        </View>
        {holdProgress > 0 && (
          <View style={styles.holdTrack}>
            <View style={[styles.holdFill, { width: `${holdProgress * 100}%` }]} />
          </View>
        )}
      </ReAnimated.View>

      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={halfPerimeter - 1}
        step={0.1}
        value={width}
        onValueChange={setWidth}
        onSlidingComplete={handleRelease}
        minimumTrackTintColor={atMax ? DL_COLORS.lime : DL_COLORS.amethyst}
        maximumTrackTintColor={DL_COLORS.surfaceMuted}
        thumbTintColor={atMax ? DL_COLORS.lime : DL_COLORS.amethyst}
        accessibilityLabel="Garden width"
      />
      <HintExplanationPanel
        hint={`Widening the garden shrinks its height — the fence length never changes. Max possible area is ${maxArea.toFixed(0)}, achieved by a square.`}
        feedback="idle"
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage 4 — Mastery Sandbox: "Architect Boss" — a composite floor plan
// ---------------------------------------------------------------------------

const STAGE4_MATCH_THRESHOLD = 95;
const STAGE4_START = { width: 8, height: 6, radius: 3 };

function computeMatchPercent(width: number, height: number, radius: number, targetArea: number): number {
  const total = width * height + Math.PI * radius * radius;
  const diffPercent = (Math.abs(total - targetArea) / targetArea) * 100;
  return Math.max(0, 100 - diffPercent);
}

// Randomized each playthrough, re-rolled if it would already be within
// reach of the sliders' fixed starting position.
function generateStage4TargetArea(): number {
  for (let attempt = 0; attempt < 20; attempt++) {
    const targetArea = randomInt(12, 40) * 10;
    if (computeMatchPercent(STAGE4_START.width, STAGE4_START.height, STAGE4_START.radius, targetArea) < 80) return targetArea;
  }
  return 200;
}

function Stage4MasterySandbox({ onCommit, isActive }: StageCanvasProps) {
  const [targetArea] = useState(generateStage4TargetArea);
  const [width, setWidth] = useState(STAGE4_START.width);
  const [height, setHeight] = useState(STAGE4_START.height);
  const [radius, setRadius] = useState(STAGE4_START.radius);
  const effects = useSuccessEffects();
  const wonRef = useRef(false);

  const total = width * height + Math.PI * radius * radius;
  const matchPercent = computeMatchPercent(width, height, radius, targetArea);

  useEffect(() => {
    if (!isActive || wonRef.current) return;
    if (matchPercent >= STAGE4_MATCH_THRESHOLD) {
      wonRef.current = true;
      effects.trigger();
      onCommit(matchPercent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchPercent, isActive]);

  const plotScale = 5;
  const rectW = width * plotScale;
  const rectH = height * plotScale;
  const circleR = radius * plotScale;

  return (
    <View style={styles.stageBody}>
      <Text style={styles.stageObjective}>
        Boss level: design a great hall + round tower matching a {targetArea} sq unit blueprint — {STAGE4_MATCH_THRESHOLD}%+ to win.
      </Text>
      <ReAnimated.View style={[styles.canvasCard, effects.targetPopStyle]}>
        <Svg width="100%" height={180} viewBox="0 0 260 180" role="img" accessibilityLabel="Composite floor plan">
          <Rect
            x={20}
            y={90 - rectH / 2}
            width={rectW}
            height={rectH}
            fill={DL_COLORS.amethystSoft}
            stroke={matchPercent >= STAGE4_MATCH_THRESHOLD ? DL_COLORS.lime : DL_COLORS.amethyst}
            strokeWidth={3}
          />
          <SvgCircle
            cx={20 + rectW + circleR}
            cy={90}
            r={circleR}
            fill={DL_COLORS.limeSoft}
            stroke={matchPercent >= STAGE4_MATCH_THRESHOLD ? DL_COLORS.lime : DL_COLORS.amethyst}
            strokeWidth={3}
          />
          {effects.isBursting && <ParticleBurst progress={effects.burstProgress} />}
        </Svg>
        <Text style={styles.totalAreaLabel}>Total area: {total.toFixed(1)} sq units</Text>
      </ReAnimated.View>

      <View style={styles.matchRow}>
        <Text style={styles.stageHint}>Match: </Text>
        <Text style={[styles.matchValue, { color: matchPercent >= STAGE4_MATCH_THRESHOLD ? DL_COLORS.lime : DL_COLORS.amethyst }]}>
          {matchPercent.toFixed(1)}%
        </Text>
      </View>

      <Text style={styles.sliderLabel}>Hall width: {width.toFixed(1)}</Text>
      <Slider style={styles.slider} minimumValue={2} maximumValue={20} step={0.1} value={width} onValueChange={setWidth} minimumTrackTintColor={DL_COLORS.amethyst} maximumTrackTintColor={DL_COLORS.surfaceMuted} thumbTintColor={DL_COLORS.amethyst} />

      <Text style={styles.sliderLabel}>Hall height: {height.toFixed(1)}</Text>
      <Slider style={styles.slider} minimumValue={2} maximumValue={20} step={0.1} value={height} onValueChange={setHeight} minimumTrackTintColor={DL_COLORS.amethyst} maximumTrackTintColor={DL_COLORS.surfaceMuted} thumbTintColor={DL_COLORS.amethyst} />

      <Text style={styles.sliderLabel}>Tower radius: {radius.toFixed(1)}</Text>
      <Slider style={styles.slider} minimumValue={1} maximumValue={10} step={0.1} value={radius} onValueChange={setRadius} minimumTrackTintColor={DL_COLORS.amethyst} maximumTrackTintColor={DL_COLORS.surfaceMuted} thumbTintColor={DL_COLORS.amethyst} />
      <HintExplanationPanel hint="Total area is the hall's rectangle (width × height) plus the tower's circle (π × radius²)." feedback="idle" />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage config + top-level module
// ---------------------------------------------------------------------------

function buildShapeArchitectStages(): MathStageConfig[] {
  return [
    {
      id: 'foundations',
      title: 'Foundations',
      objective: 'Resize a room to match a blueprint by eye.',
      targetValue: 1,
      baseXp: 20,
      toleranceThreshold: 0,
      nearMiss: { thresholdPercent: 40, message: 'Almost the right size — nudge one wall a little closer.' },
      checkWinCondition: (value, target) => value >= target,
      renderCanvas: Stage1Foundations,
      skill: 'identifying geometric dimensions',
      fastClearMs: 25000,
    },
    {
      id: 'quantitative',
      title: 'Quantitative Mechanics',
      objective: 'Area and perimeter for real construction jobs.',
      targetValue: 1,
      baseXp: 40,
      toleranceThreshold: 0,
      nearMiss: { thresholdPercent: 10, message: 'Close — double check your formula for that shape.' },
      checkWinCondition: (value, target) => value >= target,
      renderCanvas: Stage2QuantitativeMechanics,
      skill: 'calculating area and perimeter',
      fastClearMs: 25000,
    },
    {
      id: 'variables',
      title: 'Fence Optimizer',
      objective: 'Fixed fence length, changing shape — find the max area.',
      targetValue: 1,
      baseXp: 60,
      toleranceThreshold: 0,
      nearMiss: { thresholdPercent: 10, message: "So close to the max — a square uses fencing the most efficiently." },
      checkWinCondition: (value, target) => value >= target,
      renderCanvas: Stage3FenceOptimizer,
      skill: 'manipulating geometric relationships',
      fastClearMs: 25000,
    },
    {
      id: 'mastery',
      title: 'Mastery Sandbox',
      objective: 'Combine a rectangle and a circle to match a target blueprint.',
      targetValue: STAGE4_MATCH_THRESHOLD,
      baseXp: 100,
      toleranceThreshold: 0,
      checkWinCondition: (value, target) => value >= target,
      renderCanvas: Stage4MasterySandbox,
      skill: 'multi-step geometry problem solving',
      fastClearMs: 35000,
    },
  ];
}

export default function ShapeArchitectGameModule() {
  const [playthrough, setPlaythrough] = useState(0);
  const stages = React.useMemo(buildShapeArchitectStages, [playthrough]);
  return (
    <DeepLearningGameScreen
      key={playthrough}
      stages={stages}
      maxXp={220}
      realmId="geometry"
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
    marginTop: 8,
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
    gap: 8,
    marginTop: 8,
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
  totalAreaLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: DL_COLORS.text,
    marginTop: 6,
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
