import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { DL_COLORS } from './theme';

// A tap-to-select alternative to the digit keypad, specific to Number Ninja:
// instead of typing the answer, the player is shown a small scattered pile
// of numbered wooden blocks (like a tumble-tower toy) — the correct answer
// plus a few plausible wrong ones built from common arithmetic mistakes —
// and has to pick the right one. Keeps the same onCommit/scoring contract
// as the keypad version; only the input widget changes, so nothing about
// stage logic or win conditions moves.

const WOOD = {
  base: '#DDB27E',
  baseLight: '#EAC99A',
  grain: 'rgba(122, 75, 35, 0.28)',
  border: '#7A4B23',
  text: '#4A2E12',
};

type BlockState = 'idle' | 'correct' | 'wrong' | 'reveal';

export interface AnswerBlocksProps {
  options: number[];
  selected: number | null;
  correctValue: number;
  feedback: 'idle' | 'correct' | 'wrong';
  disabled?: boolean;
  onSelect: (value: number) => void;
  prefix?: string;
}

function AnswerBlock({
  value,
  prefix,
  state,
  disabled,
  onPress,
}: {
  value: number;
  prefix?: string;
  state: BlockState;
  disabled?: boolean;
  onPress: () => void;
}) {
  const shake = useSharedValue(0);
  // A stable, per-block tilt and vertical offset — set once so a scattered
  // pile of blocks doesn't feel like a rigid grid, and doesn't re-jitter on
  // every re-render (only when a fresh set of blocks mounts for a new round).
  const [tilt] = useState(() => randomInt(-6, 6));
  const [liftY] = useState(() => randomInt(-4, 4));

  useEffect(() => {
    if (state !== 'wrong') return;
    shake.value = withSequence(
      withTiming(-6, { duration: 45 }),
      withTiming(6, { duration: 45 }),
      withTiming(-4, { duration: 45 }),
      withTiming(4, { duration: 45 }),
      withTiming(0, { duration: 45 })
    );
  }, [state, shake]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }, { translateY: liftY }, { rotate: `${tilt}deg` }],
  }));

  return (
    <Animated.View style={[styles.blockWrap, animStyle]}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        style={[
          styles.block,
          state === 'correct' && styles.blockCorrect,
          state === 'wrong' && styles.blockWrong,
          state === 'reveal' && styles.blockReveal,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Answer option ${value}`}
      >
        <View style={styles.grainLine} />
        <View style={[styles.grainLine, styles.grainLineLower]} />
        <Text style={styles.blockText}>
          {prefix ?? ''}
          {value}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** A small scattered pile of tappable wooden number blocks — one correct, the rest plausible wrong answers. Tapping the wrong one shakes it and glows red, and reveals the right one in lime, so a miss still teaches something. */
export function AnswerBlocks({ options, selected, correctValue, feedback, disabled, onSelect, prefix }: AnswerBlocksProps) {
  return (
    <View style={styles.grid}>
      {options.map((opt) => {
        let state: BlockState = 'idle';
        if (feedback !== 'idle') {
          if (opt === selected) state = feedback === 'correct' ? 'correct' : 'wrong';
          else if (feedback === 'wrong' && opt === correctValue) state = 'reveal';
        }
        return (
          <AnswerBlock
            key={opt}
            value={opt}
            prefix={prefix}
            state={state}
            disabled={disabled || feedback !== 'idle'}
            onPress={() => onSelect(opt)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    paddingVertical: 6,
  },
  blockWrap: {
    width: '43%',
    minWidth: 118,
  },
  block: {
    aspectRatio: 2.3,
    borderRadius: 6,
    borderWidth: 2.5,
    borderColor: WOOD.border,
    backgroundColor: WOOD.base,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    overflow: 'hidden',
  },
  grainLine: {
    position: 'absolute',
    left: '12%',
    right: '12%',
    top: '32%',
    height: 2,
    backgroundColor: WOOD.grain,
    borderRadius: 999,
  },
  grainLineLower: {
    top: '64%',
  },
  blockCorrect: {
    borderColor: DL_COLORS.lime,
    shadowColor: DL_COLORS.lime,
    shadowOpacity: 0.9,
    shadowOffset: { width: 0, height: 0 },
  },
  blockWrong: {
    borderColor: DL_COLORS.danger,
    shadowColor: DL_COLORS.danger,
    shadowOpacity: 0.9,
    shadowOffset: { width: 0, height: 0 },
  },
  blockReveal: {
    borderColor: DL_COLORS.lime,
    shadowColor: DL_COLORS.lime,
    shadowOpacity: 0.7,
    shadowOffset: { width: 0, height: 0 },
  },
  blockText: {
    fontSize: 26,
    fontWeight: '800',
    color: WOOD.text,
  },
});
