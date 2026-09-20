import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { DL_COLORS } from './theme';
import type { MathStageConfig } from './types';

interface LevelSelectorProps {
  stages: MathStageConfig[];
  activeStageIndex: number;
  unlockedStages: string[];
  onSelectStage: (index: number) => void;
}

export default function LevelSelector({ stages, activeStageIndex, unlockedStages, onSelectStage }: LevelSelectorProps) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {stages.map((stage, index) => {
        const isUnlocked = unlockedStages.includes(stage.id);
        const isActive = index === activeStageIndex;
        const isCompleted = isUnlocked && index < activeStageIndex;

        return (
          <React.Fragment key={stage.id}>
            <StageNode
              index={index}
              isActive={isActive}
              isCompleted={isCompleted}
              isLocked={!isUnlocked}
              onPress={() => isUnlocked && onSelectStage(index)}
            />
            {index < stages.length - 1 && (
              <Text style={[styles.arrow, { color: isCompleted ? DL_COLORS.lime : DL_COLORS.textMuted }]}>➔</Text>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

interface StageNodeProps {
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  isLocked: boolean;
  onPress: () => void;
}

function StageNode({ index, isActive, isCompleted, isLocked, onPress }: StageNodeProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isActive, pulse]);

  const glowRadius = pulse.interpolate({ inputRange: [0, 1], outputRange: [4, 14] });

  let backgroundColor: string = DL_COLORS.surfaceMuted;
  let borderColor: string = DL_COLORS.border;
  let inner = (
    <Text style={[styles.nodeLabel, isLocked && styles.nodeLabelLocked]}>{isLocked ? '🔒' : index + 1}</Text>
  );

  if (isCompleted) {
    backgroundColor = DL_COLORS.limeSoft;
    borderColor = DL_COLORS.lime;
    inner = <Text style={[styles.nodeLabel, { color: DL_COLORS.lime }]}>✓</Text>;
  } else if (isActive) {
    backgroundColor = DL_COLORS.amethystSoft;
    borderColor = DL_COLORS.amethyst;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isLocked}
      style={styles.nodeWrap}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive, disabled: isLocked }}
      accessibilityLabel={`Stage ${index + 1}${isLocked ? ', locked' : isCompleted ? ', completed' : isActive ? ', active' : ''}`}
    >
      <Animated.View
        style={[
          styles.node,
          { backgroundColor, borderColor },
          isActive && {
            shadowColor: DL_COLORS.amethyst,
            shadowOpacity: 0.9,
            shadowRadius: glowRadius,
            shadowOffset: { width: 0, height: 0 },
            elevation: 8,
          },
        ]}
      >
        {inner}
      </Animated.View>
      <Text style={styles.nodeCaption}>Stage {index + 1}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    flexWrap: 'wrap',
  },
  nodeWrap: {
    alignItems: 'center',
    gap: 4,
  },
  node: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: DL_COLORS.text,
  },
  nodeLabelLocked: {
    fontSize: 14,
    color: DL_COLORS.textMuted,
  },
  nodeCaption: {
    fontSize: 10,
    fontWeight: '700',
    color: DL_COLORS.textMuted,
  },
  arrow: {
    fontSize: 16,
    marginHorizontal: 4,
    marginBottom: 16,
  },
});
