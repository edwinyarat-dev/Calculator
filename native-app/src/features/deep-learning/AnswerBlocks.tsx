import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { DL_COLORS } from './theme';

// A tap-to-select alternative to the digit keypad, specific to Number Ninja:
// instead of typing the answer, the player is shown several rune blocks —
// the correct answer plus a few plausible wrong ones built from common
// arithmetic mistakes — and has to pick the right one. Keeps the same
// onCommit/scoring contract as the keypad version; only the input widget
// changes, so nothing about stage logic or win conditions moves.

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

  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

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
        <View style={styles.blockFacet} />
        <Text
          style={[
            styles.blockText,
            state === 'correct' && styles.blockTextCorrect,
            state === 'wrong' && styles.blockTextWrong,
          ]}
        >
          {prefix ?? ''}
          {value}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/** A row of tappable rune blocks — one correct, the rest plausible wrong answers. Tapping the wrong one shakes it red and reveals the right one in lime, so a miss still teaches something. */
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
    gap: 12,
    width: '100%',
  },
  blockWrap: {
    width: '43%',
    minWidth: 110,
  },
  block: {
    aspectRatio: 1.5,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: DL_COLORS.sky,
    backgroundColor: DL_COLORS.skySoft,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: DL_COLORS.sky,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  blockFacet: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 60,
    height: 60,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  blockCorrect: {
    borderColor: DL_COLORS.lime,
    backgroundColor: DL_COLORS.limeSoft,
    shadowColor: DL_COLORS.lime,
    shadowOpacity: 0.9,
  },
  blockWrong: {
    borderColor: DL_COLORS.danger,
    backgroundColor: DL_COLORS.dangerSoft,
    shadowColor: DL_COLORS.danger,
    shadowOpacity: 0.9,
  },
  blockReveal: {
    borderColor: DL_COLORS.lime,
    backgroundColor: 'transparent',
  },
  blockText: {
    fontSize: 26,
    fontWeight: '800',
    color: DL_COLORS.text,
  },
  blockTextCorrect: {
    color: DL_COLORS.lime,
  },
  blockTextWrong: {
    color: DL_COLORS.danger,
  },
});
