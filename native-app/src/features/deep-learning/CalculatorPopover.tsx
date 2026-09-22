import { Calculator as CalculatorIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { DL_COLORS } from './theme';

// A small, self-contained four-function calculator that pops out over any
// Magic Deck — for a quick side computation (checking arithmetic by hand,
// working out a percentage) without leaving the stage. Entirely separate
// from a stage's own scoring: nothing typed in here is ever read by the
// game, it's just scratch paper. Logic mirrors this repo's own root-level
// calculator (script.js) — same operator-chaining state machine, ported to
// React state instead of manual DOM re-renders.

const MAX_DIGITS = 12;

interface CalcState {
  current: string;
  previous: string | null;
  operator: string | null;
  overwrite: boolean;
}

const INITIAL_STATE: CalcState = { current: '0', previous: null, operator: null, overwrite: false };

function compute(a: number, b: number, op: string): number {
  switch (op) {
    case '+':
      return a + b;
    case '−':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      return b === 0 ? NaN : a / b;
    default:
      return b;
  }
}

function trimResult(num: number): string {
  if (!Number.isFinite(num)) return 'Error';
  const rounded = Math.round((num + Number.EPSILON) * 1e10) / 1e10;
  return String(rounded);
}

function formatDisplay(value: string): string {
  if (value === 'Error') return 'Error';
  const num = Number(value);
  if (!Number.isFinite(num)) return 'Error';
  if (Math.abs(num) >= 1e12 || (Math.abs(num) < 1e-9 && num !== 0)) return num.toExponential(6);
  const parts = value.split('.');
  const intFormatted = new Intl.NumberFormat('en-US').format(Number(parts[0]));
  return parts.length > 1 ? `${intFormatted}.${parts[1]}` : intFormatted;
}

type KeyKind = 'digit' | 'operator' | 'equals' | 'clear' | 'func';

function CalcKey({
  label,
  onPress,
  kind = 'digit',
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  kind?: KeyKind;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.key, styles[`key_${kind}`]]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text style={[styles.keyText, styles[`keyText_${kind}`]]}>{label}</Text>
    </Pressable>
  );
}

/** The reusable trigger + popup — drop one into any Magic Deck header. */
export function CalculatorPopover() {
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<CalcState>(INITIAL_STATE);

  function inputDigit(digit: string) {
    setState((s) => {
      if (s.current === 'Error' || s.overwrite) return { ...s, current: digit, overwrite: false };
      if (s.current === '0') return { ...s, current: digit };
      if (s.current.replace('-', '').replace('.', '').length >= MAX_DIGITS) return s;
      return { ...s, current: s.current + digit };
    });
  }

  function inputDecimal() {
    setState((s) => {
      if (s.current === 'Error' || s.overwrite) return { ...s, current: '0.', overwrite: false };
      if (s.current.includes('.')) return s;
      return { ...s, current: s.current + '.' };
    });
  }

  function clearAll() {
    setState(INITIAL_STATE);
  }

  function backspace() {
    setState((s) => {
      if (s.current === 'Error' || s.overwrite) return INITIAL_STATE;
      return { ...s, current: s.current.length > 1 ? s.current.slice(0, -1) : '0' };
    });
  }

  function toggleSign() {
    setState((s) => {
      if (s.current === '0' || s.current === 'Error') return s;
      return { ...s, current: s.current.startsWith('-') ? s.current.slice(1) : `-${s.current}` };
    });
  }

  function percent() {
    setState((s) => (s.current === 'Error' ? s : { ...s, current: String(Number(s.current) / 100) }));
  }

  function setOperator(symbol: string) {
    setState((s) => {
      if (s.current === 'Error') return s;
      if (s.operator && !s.overwrite) {
        const result = compute(Number(s.previous), Number(s.current), s.operator);
        const next = Number.isNaN(result) ? 'Error' : trimResult(result);
        return { previous: next, current: next, operator: symbol, overwrite: true };
      }
      return { ...s, previous: s.current, operator: symbol, overwrite: true };
    });
  }

  function evaluate() {
    setState((s) => {
      if (!s.operator || s.previous === null || s.current === 'Error') return s;
      const result = compute(Number(s.previous), Number(s.current), s.operator);
      return { current: trimResult(result), previous: null, operator: null, overwrite: true };
    });
  }

  function close() {
    setVisible(false);
    setState(INITIAL_STATE);
  }

  const expression = state.operator && state.previous !== null ? `${formatDisplay(state.previous)} ${state.operator}` : ' ';

  return (
    <>
      <Pressable onPress={() => setVisible(true)} style={styles.trigger} accessibilityRole="button" accessibilityLabel="Open calculator">
        <CalculatorIcon size={14} color={DL_COLORS.sky} strokeWidth={2.4} />
      </Pressable>
      <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable style={styles.card} onPress={() => {}}>
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <CalculatorIcon size={17} color={DL_COLORS.sky} strokeWidth={2.2} />
                <Text style={styles.heading}>Calculator</Text>
              </View>
              <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close calculator" style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.display}>
              <Text style={styles.expression} numberOfLines={1}>
                {expression}
              </Text>
              <Text style={styles.output} numberOfLines={1} adjustsFontSizeToFit>
                {formatDisplay(state.current)}
              </Text>
            </View>

            <View style={styles.grid}>
              <CalcKey label="C" kind="clear" onPress={clearAll} accessibilityLabel="Clear" />
              <CalcKey label="⌫" kind="func" onPress={backspace} accessibilityLabel="Backspace" />
              <CalcKey label="%" kind="func" onPress={percent} accessibilityLabel="Percent" />
              <CalcKey label="÷" kind="operator" onPress={() => setOperator('÷')} accessibilityLabel="Divide" />

              <CalcKey label="7" onPress={() => inputDigit('7')} />
              <CalcKey label="8" onPress={() => inputDigit('8')} />
              <CalcKey label="9" onPress={() => inputDigit('9')} />
              <CalcKey label="×" kind="operator" onPress={() => setOperator('×')} accessibilityLabel="Multiply" />

              <CalcKey label="4" onPress={() => inputDigit('4')} />
              <CalcKey label="5" onPress={() => inputDigit('5')} />
              <CalcKey label="6" onPress={() => inputDigit('6')} />
              <CalcKey label="−" kind="operator" onPress={() => setOperator('−')} accessibilityLabel="Subtract" />

              <CalcKey label="1" onPress={() => inputDigit('1')} />
              <CalcKey label="2" onPress={() => inputDigit('2')} />
              <CalcKey label="3" onPress={() => inputDigit('3')} />
              <CalcKey label="+" kind="operator" onPress={() => setOperator('+')} accessibilityLabel="Add" />

              <CalcKey label="±" kind="func" onPress={toggleSign} accessibilityLabel="Toggle sign" />
              <CalcKey label="0" onPress={() => inputDigit('0')} />
              <CalcKey label="." onPress={inputDecimal} accessibilityLabel="Decimal point" />
              <CalcKey label="=" kind="equals" onPress={evaluate} accessibilityLabel="Equals" />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export default CalculatorPopover;

const KEY_SIZE = 56;
const KEY_GAP = 8;

const styles = StyleSheet.create({
  trigger: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: DL_COLORS.sky,
    backgroundColor: DL_COLORS.skySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 9, 18, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: KEY_SIZE * 4 + KEY_GAP * 3 + 40,
    maxWidth: '100%',
    backgroundColor: DL_COLORS.surface,
    borderWidth: 2,
    borderColor: DL_COLORS.sky,
    borderRadius: 24,
    padding: 20,
    gap: 14,
    shadowColor: DL_COLORS.sky,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heading: {
    fontSize: 15,
    fontWeight: '800',
    color: DL_COLORS.text,
  },
  closeButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: DL_COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: DL_COLORS.textMuted,
  },
  display: {
    backgroundColor: DL_COLORS.bgDeep,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DL_COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-end',
    gap: 2,
  },
  expression: {
    fontSize: 13,
    fontWeight: '700',
    color: DL_COLORS.textMuted,
  },
  output: {
    fontSize: 32,
    fontWeight: '800',
    color: DL_COLORS.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: KEY_GAP,
  },
  key: {
    width: KEY_SIZE,
    height: KEY_SIZE,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 20,
    fontWeight: '800',
  },
  key_digit: {
    backgroundColor: DL_COLORS.surfaceMuted,
  },
  keyText_digit: {
    color: DL_COLORS.text,
  },
  key_operator: {
    backgroundColor: DL_COLORS.skySoft,
  },
  keyText_operator: {
    color: DL_COLORS.sky,
  },
  key_equals: {
    backgroundColor: DL_COLORS.lime,
  },
  keyText_equals: {
    color: DL_COLORS.bgDeep,
  },
  key_clear: {
    backgroundColor: DL_COLORS.dangerSoft,
  },
  keyText_clear: {
    color: DL_COLORS.danger,
  },
  key_func: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: DL_COLORS.border,
  },
  keyText_func: {
    color: DL_COLORS.textMuted,
    fontSize: 17,
  },
});
