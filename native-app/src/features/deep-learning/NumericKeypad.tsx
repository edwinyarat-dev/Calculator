import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DL_COLORS } from './theme';

// Shared across every module that answers a stage by typing digits rather
// than dragging a slider (Number Ninja, Money Grower, Data Detective, …).

export interface NumericKeypadProps {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function NumericKeypad({ onDigit, onBackspace, onSubmit, disabled }: NumericKeypadProps) {
  const rows = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
  ];
  return (
    <View style={styles.keypad}>
      {rows.map((row, i) => (
        <View key={i} style={styles.keypadRow}>
          {row.map((d) => (
            <Pressable
              key={d}
              disabled={disabled}
              onPress={() => onDigit(d)}
              style={styles.keypadKey}
              accessibilityRole="button"
              accessibilityLabel={`Digit ${d}`}
            >
              <Text style={styles.keypadKeyText}>{d}</Text>
            </Pressable>
          ))}
        </View>
      ))}
      <View style={styles.keypadRow}>
        <Pressable
          disabled={disabled}
          onPress={onBackspace}
          style={styles.keypadKeyMuted}
          accessibilityRole="button"
          accessibilityLabel="Backspace"
        >
          <Text style={styles.keypadKeyMutedText}>⌫</Text>
        </Pressable>
        <Pressable
          disabled={disabled}
          onPress={() => onDigit('0')}
          style={styles.keypadKey}
          accessibilityRole="button"
          accessibilityLabel="Digit 0"
        >
          <Text style={styles.keypadKeyText}>0</Text>
        </Pressable>
        <Pressable
          disabled={disabled}
          onPress={onSubmit}
          style={styles.keypadKeySubmit}
          accessibilityRole="button"
          accessibilityLabel="Check answer"
        >
          <Text style={styles.keypadKeySubmitText}>✓</Text>
        </Pressable>
      </View>
    </View>
  );
}

export interface EntryDisplayProps {
  prompt: string;
  entry: string;
  feedback: 'idle' | 'correct' | 'wrong';
  /** Shown before the typed digits, e.g. "$" for money problems. */
  prefix?: string;
}

export function EntryDisplay({ prompt, entry, feedback, prefix }: EntryDisplayProps) {
  // Cosmetic-only "spell charge" — fills up as digits are typed, capped at a
  // handful of digits. Purely derived from the entry string already passed
  // in, so every existing call site gets it for free with no prop changes.
  const chargePct = feedback === 'idle' ? Math.min(100, entry.length * 25) : entry.length > 0 ? 100 : 0;

  return (
    <View style={styles.entryCard}>
      <Text style={styles.promptText}>{prompt}</Text>
      <View
        style={[
          styles.entryBox,
          feedback === 'correct' && styles.entryBoxCorrect,
          feedback === 'wrong' && styles.entryBoxWrong,
        ]}
      >
        <Text style={styles.entryText}>{entry ? `${prefix ?? ''}${entry}` : '?'}</Text>
      </View>
      <View style={styles.chargeTrack}>
        <View style={[styles.chargeFill, { width: `${chargePct}%` }, chargePct >= 100 && styles.chargeFillReady]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  entryCard: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  promptText: {
    fontSize: 24,
    fontWeight: '800',
    color: DL_COLORS.text,
    textAlign: 'center',
  },
  entryBox: {
    minWidth: 120,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: DL_COLORS.border,
    backgroundColor: DL_COLORS.surfaceMuted,
    alignItems: 'center',
  },
  entryBoxCorrect: {
    borderColor: DL_COLORS.lime,
    backgroundColor: DL_COLORS.limeSoft,
  },
  entryBoxWrong: {
    borderColor: '#FF5C5C',
    backgroundColor: 'rgba(255, 92, 92, 0.16)',
  },
  entryText: {
    fontSize: 28,
    fontWeight: '800',
    color: DL_COLORS.text,
  },
  chargeTrack: {
    width: '100%',
    maxWidth: 160,
    height: 6,
    borderRadius: 999,
    backgroundColor: DL_COLORS.surfaceMuted,
    overflow: 'hidden',
  },
  chargeFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: DL_COLORS.amethyst,
  },
  chargeFillReady: {
    backgroundColor: DL_COLORS.lime,
    shadowColor: DL_COLORS.lime,
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  keypad: {
    width: '100%',
    gap: 8,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 8,
  },
  keypadKey: {
    flex: 1,
    aspectRatio: 1.6,
    borderRadius: 14,
    backgroundColor: DL_COLORS.surface,
    borderWidth: 2,
    borderColor: DL_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadKeyText: {
    fontSize: 20,
    fontWeight: '800',
    color: DL_COLORS.text,
  },
  keypadKeyMuted: {
    flex: 1,
    aspectRatio: 1.6,
    borderRadius: 14,
    backgroundColor: DL_COLORS.surfaceMuted,
    borderWidth: 2,
    borderColor: DL_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadKeyMutedText: {
    fontSize: 18,
    fontWeight: '700',
    color: DL_COLORS.textMuted,
  },
  keypadKeySubmit: {
    flex: 1,
    aspectRatio: 1.6,
    borderRadius: 14,
    backgroundColor: DL_COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadKeySubmitText: {
    fontSize: 20,
    fontWeight: '800',
    color: DL_COLORS.bgDeep,
  },
});
