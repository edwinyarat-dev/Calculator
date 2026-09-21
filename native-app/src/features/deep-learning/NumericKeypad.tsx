import { Wand2 } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useBattlePulse } from './BattlePulseContext';
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
  const pulse = useBattlePulse();
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
              onPress={() => {
                pulse();
                onDigit(d);
              }}
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
          onPress={() => {
            pulse();
            onDigit('0');
          }}
          style={styles.keypadKey}
          accessibilityRole="button"
          accessibilityLabel="Digit 0"
        >
          <Text style={styles.keypadKeyText}>0</Text>
        </Pressable>
        <Pressable
          disabled={disabled}
          onPress={() => {
            pulse();
            onSubmit();
          }}
          style={styles.keypadKeySubmit}
          accessibilityRole="button"
          accessibilityLabel="Check answer"
        >
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="castGradient" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor={DL_COLORS.sky} />
                <Stop offset="100%" stopColor={DL_COLORS.amethyst} />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width="100%" height="100%" rx={14} fill="url(#castGradient)" />
          </Svg>
          <Wand2 size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.keypadKeySubmitText}>Cast</Text>
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
      <View style={styles.chargeHeader}>
        <Wand2 size={12} color={DL_COLORS.sky} strokeWidth={2.5} />
        <Text style={styles.chargeLabel}>Spell Charge</Text>
      </View>
      <View style={styles.chargeTrack}>
        <View style={[styles.chargeFillWrap, { width: `${chargePct}%` }]}>
          <Svg width={160} height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="chargeGradient" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0%" stopColor={DL_COLORS.sky} />
                <Stop offset="50%" stopColor={DL_COLORS.amethyst} />
                <Stop offset="100%" stopColor={DL_COLORS.sky} />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width="100%" height="100%" fill="url(#chargeGradient)" />
          </Svg>
        </View>
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
  chargeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  chargeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: DL_COLORS.sky,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chargeTrack: {
    width: '100%',
    maxWidth: 160,
    height: 6,
    borderRadius: 999,
    backgroundColor: DL_COLORS.skySoft,
    overflow: 'hidden',
  },
  chargeFillWrap: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
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
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    overflow: 'hidden',
  },
  keypadKeySubmitText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
