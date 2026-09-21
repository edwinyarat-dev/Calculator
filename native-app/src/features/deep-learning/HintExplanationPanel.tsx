import { Lightbulb } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DL_COLORS } from './theme';

export interface HintExplanationPanelProps {
  hint?: string;
  /** Shown once the round resolves — pass null while the question is still open. */
  explanation?: string | null;
  feedback: 'idle' | 'correct' | 'wrong' | 'nearMiss';
  onUseHint?: () => void;
  disabled?: boolean;
}

/**
 * A small, reusable "💡 Hint" toggle plus post-answer explanation strip.
 * Every realm's problems carry a `hint`/`explanation` string (see
 * `MathProblem` in types.ts); this is the one place that renders them, so
 * every stage looks and behaves the same way instead of each module
 * reinventing its own feedback text styling.
 */
export function HintExplanationPanel({ hint, explanation, feedback, onUseHint, disabled }: HintExplanationPanelProps) {
  const [hintOpen, setHintOpen] = useState(false);

  function toggleHint() {
    if (disabled) return;
    if (!hintOpen) onUseHint?.();
    setHintOpen((v) => !v);
  }

  const showExplanation = feedback !== 'idle' && !!explanation;

  return (
    <View style={styles.wrap}>
      {feedback === 'idle' && !!hint && (
        <Pressable
          onPress={toggleHint}
          style={styles.hintButton}
          accessibilityRole="button"
          accessibilityLabel={hintOpen ? 'Hide hint' : 'Show hint'}
        >
          <Lightbulb size={14} color={DL_COLORS.amethyst} strokeWidth={2.5} />
          <Text style={styles.hintButtonText}>{hintOpen ? 'Hide Hint' : 'Hint'}</Text>
        </Pressable>
      )}
      {feedback === 'idle' && hintOpen && !!hint && (
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>{hint}</Text>
        </View>
      )}
      {showExplanation && (
        <View
          style={[
            styles.explanationBox,
            feedback === 'correct' && styles.explanationCorrect,
            feedback === 'wrong' && styles.explanationWrong,
            feedback === 'nearMiss' && styles.explanationNearMiss,
          ]}
        >
          <Text style={styles.explanationLead}>
            {feedback === 'correct' ? 'Correct!' : feedback === 'nearMiss' ? 'So close!' : 'Not quite.'}
          </Text>
          <Text style={styles.explanationText}>{explanation}</Text>
        </View>
      )}
    </View>
  );
}

export default HintExplanationPanel;

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 8,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: DL_COLORS.amethyst,
    backgroundColor: DL_COLORS.amethystSoft,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  hintButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: DL_COLORS.amethyst,
  },
  hintBox: {
    borderWidth: 1.5,
    borderColor: DL_COLORS.amethyst,
    backgroundColor: DL_COLORS.surfaceMuted,
    borderRadius: 12,
    padding: 10,
  },
  hintText: {
    fontSize: 13,
    fontWeight: '600',
    color: DL_COLORS.text,
    textAlign: 'center',
  },
  explanationBox: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 10,
    gap: 3,
    borderColor: DL_COLORS.border,
    backgroundColor: DL_COLORS.surfaceMuted,
  },
  explanationCorrect: {
    borderColor: DL_COLORS.lime,
    backgroundColor: DL_COLORS.limeSoft,
  },
  explanationWrong: {
    borderColor: DL_COLORS.danger,
    backgroundColor: DL_COLORS.dangerSoft,
  },
  explanationNearMiss: {
    borderColor: DL_COLORS.amethyst,
    backgroundColor: DL_COLORS.amethystSoft,
  },
  explanationLead: {
    fontSize: 13,
    fontWeight: '800',
    color: DL_COLORS.text,
  },
  explanationText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: DL_COLORS.textMuted,
    lineHeight: 17,
  },
});
