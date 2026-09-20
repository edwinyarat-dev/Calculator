import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { theme } from '../theme';

// The keypad lives in its own dark "dojo" panel — a deliberate departure from
// a plain light grid, so this reads as Number Ninja's own tool rather than a
// reskinned system calculator. The lesson content below stays on the app's
// normal light surface for readability.
const DOJO = {
  panel: '#241B3A',
  panelBorder: 'rgba(255, 159, 69, 0.35)',
  tile: '#332A52',
  tileBorder: 'rgba(255, 255, 255, 0.08)',
  textOnDark: '#FFFFFF',
  mutedOnDark: 'rgba(255, 255, 255, 0.55)',
};

const COLORS = {
  surface: theme.color.surface,
  border: theme.color.border,
  text: theme.color.text,
  textMuted: theme.color.textMuted,
  operator: theme.color.tangerine,
  equals: theme.color.mint,
  equalsDark: theme.color.mintDark,
};

const nf = new Intl.NumberFormat('en-US');
function fmt(n: number): string {
  if (!Number.isFinite(n)) return 'Error';
  const rounded = Math.round((n + Number.EPSILON) * 1e6) / 1e6;
  return nf.format(rounded);
}

type OpSymbol = '÷' | '×' | '−' | '+';
const OPS: Record<OpSymbol, string> = { '÷': '/', '×': '*', '−': '-', '+': '+' };

function compute(a: number, b: number, op: string): number {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return b === 0 ? NaN : a / b;
    default: return b;
  }
}

interface Step {
  type: 'start' | 'op';
  opSymbol?: OpSymbol;
  a?: number;
  b?: number;
  value: number;
}

type KeyVariant = 'digit' | 'fn' | 'operator' | 'equals';

interface CalcKeyProps {
  label: string;
  onPress: () => void;
  variant: KeyVariant;
  wide?: boolean;
}

// Every tap gets a quick "slash" — a scale-down plus a slight rotate that
// springs back — instead of a flat color-swap, so the keypad feels alive.
function CalcKey({ label, onPress, variant, wide }: CalcKeyProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  function pressIn() {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.88, useNativeDriver: false, speed: 40, bounciness: 6 }),
      Animated.timing(rotate, { toValue: 1, duration: 70, useNativeDriver: false }),
    ]).start();
  }
  function pressOut() {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: false, speed: 14, bounciness: 10 }),
      Animated.timing(rotate, { toValue: 0, duration: 140, useNativeDriver: false }),
    ]).start();
  }

  const rotateDeg = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-8deg'] });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={[styles.key, keyVariantStyle[variant], wide && styles.keyWide]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View style={{ transform: [{ scale }, { rotate: rotateDeg }] }}>
        <Text style={keyLabelStyle[variant]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const CHART_W = 300;
const CHART_H = 160;
const PAD_L = 36;
const PAD_R = 14;
const PAD_T = 14;
const PAD_B = 24;

function StepsChart({ steps }: { steps: Step[] }) {
  const points = steps.filter((s) => Number.isFinite(s.value)).map((s, i) => ({ x: i + 1, y: s.value }));
  const plotW = CHART_W - PAD_L - PAD_R;
  const plotH = CHART_H - PAD_T - PAD_B;

  if (points.length === 0) {
    return (
      <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`} role="img" accessibilityLabel="Steps chart">
        <Line x1={PAD_L} y1={CHART_H - PAD_B} x2={CHART_W - PAD_R} y2={CHART_H - PAD_B} stroke={COLORS.border} strokeWidth={1.5} />
      </Svg>
    );
  }

  const xMin = 1;
  const xMax = Math.max(points[points.length - 1].x, 1);
  const yMax = Math.max(...points.map((p) => p.y), 1) * 1.15;
  const xSpan = xMax - xMin || 1;

  const sx = (x: number) => PAD_L + ((x - xMin) / xSpan) * plotW;
  const sy = (y: number) => PAD_T + plotH - (y / (yMax || 1)) * plotH;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.x)},${sy(p.y)}`).join(' ');

  return (
    <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`} role="img" accessibilityLabel="Chart of each calculation step">
      <Line x1={PAD_L} y1={sy(0)} x2={CHART_W - PAD_R} y2={sy(0)} stroke={COLORS.border} strokeWidth={1.5} />
      <Path d={linePath} fill="none" stroke={COLORS.operator} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => {
        const isLast = i === points.length - 1;
        return (
          <Line
            key={i}
            x1={sx(p.x)} y1={sy(p.y)} x2={sx(p.x)} y2={sy(p.y)}
            stroke={isLast ? COLORS.equalsDark : COLORS.operator}
            strokeWidth={isLast ? 9 : 7}
            strokeLinecap="round"
          />
        );
      })}
    </Svg>
  );
}

export default function ArithmeticModule() {
  const [current, setCurrent] = useState('0');
  const [previous, setPrevious] = useState<string | null>(null);
  const [operator, setOperator] = useState<OpSymbol | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  function logStep(step: Step) {
    setSteps((prev) => [...prev, step].slice(-12));
  }

  function inputDigit(digit: string) {
    if (current === 'Error' || overwrite) {
      setCurrent(digit);
      setOverwrite(false);
      return;
    }
    if (current === '0') setCurrent(digit);
    else if (current.replace('-', '').replace('.', '').length < 15) setCurrent(current + digit);
  }

  function inputDecimal() {
    if (current === 'Error' || overwrite) {
      setCurrent('0.');
      setOverwrite(false);
      return;
    }
    if (!current.includes('.')) setCurrent(current + '.');
  }

  function clearAll() {
    setCurrent('0');
    setPrevious(null);
    setOperator(null);
    setOverwrite(false);
    setSteps([]);
  }

  function backspace() {
    if (current === 'Error' || overwrite) {
      clearAll();
      return;
    }
    setCurrent(current.length > 1 ? current.slice(0, -1) : '0');
  }

  function percent() {
    if (current === 'Error') return;
    setCurrent(String(Number(current) / 100));
  }

  function trimResult(num: number): string {
    if (!Number.isFinite(num)) return 'Error';
    return String(Math.round((num + Number.EPSILON) * 1e10) / 1e10);
  }

  function setOp(symbol: OpSymbol) {
    if (current === 'Error') return;
    if (operator && !overwrite) {
      const a = Number(previous);
      const b = Number(current);
      const resultNum = compute(a, b, OPS[operator]);
      const resultStr = trimResult(resultNum);
      logStep({ type: 'op', opSymbol: operator, a, b, value: resultStr === 'Error' ? NaN : Number(resultStr) });
      setPrevious(resultStr);
      setCurrent(resultStr);
    } else {
      setPrevious(current);
      if (steps.length === 0) logStep({ type: 'start', value: Number(current) });
    }
    setOperator(symbol);
    setOverwrite(true);
  }

  function evaluate() {
    if (!operator || previous === null || current === 'Error') return;
    const a = Number(previous);
    const b = Number(current);
    const resultNum = compute(a, b, OPS[operator]);
    const resultStr = trimResult(resultNum);
    logStep({ type: 'op', opSymbol: operator, a, b, value: resultStr === 'Error' ? NaN : Number(resultStr) });
    setCurrent(resultStr);
    setPrevious(null);
    setOperator(null);
    setOverwrite(true);
  }

  const displayValue = current === 'Error' ? 'Error' : fmt(Number(current));
  const expression = operator && previous !== null ? `${fmt(Number(previous))} ${operator}` : '';
  const latestStep = steps[steps.length - 1];

  return (
    <View style={styles.container}>
      <View style={styles.dojo}>
        <View style={styles.display}>
          <Text style={styles.expression}>{expression || ' '}</Text>
          <Text style={styles.displayValue}>{displayValue}</Text>
        </View>

        <View style={styles.keys}>
          <CalcKey label="AC" onPress={clearAll} variant="fn" />
          <CalcKey label="⌫" onPress={backspace} variant="fn" />
          <CalcKey label="%" onPress={percent} variant="fn" />
          <CalcKey label="÷" onPress={() => setOp('÷')} variant="operator" />

          <CalcKey label="7" onPress={() => inputDigit('7')} variant="digit" />
          <CalcKey label="8" onPress={() => inputDigit('8')} variant="digit" />
          <CalcKey label="9" onPress={() => inputDigit('9')} variant="digit" />
          <CalcKey label="×" onPress={() => setOp('×')} variant="operator" />

          <CalcKey label="4" onPress={() => inputDigit('4')} variant="digit" />
          <CalcKey label="5" onPress={() => inputDigit('5')} variant="digit" />
          <CalcKey label="6" onPress={() => inputDigit('6')} variant="digit" />
          <CalcKey label="−" onPress={() => setOp('−')} variant="operator" />

          <CalcKey label="1" onPress={() => inputDigit('1')} variant="digit" />
          <CalcKey label="2" onPress={() => inputDigit('2')} variant="digit" />
          <CalcKey label="3" onPress={() => inputDigit('3')} variant="digit" />
          <CalcKey label="+" onPress={() => setOp('+')} variant="operator" />

          <CalcKey label="0" onPress={() => inputDigit('0')} variant="digit" wide />
          <CalcKey label="." onPress={inputDecimal} variant="digit" />
          <CalcKey label="=" onPress={evaluate} variant="equals" />
        </View>
      </View>

      <Text style={styles.sectionLabel}>Step-by-step breakdown</Text>
      <View style={styles.breakdown}>
        {steps.length === 0 ? (
          <Text style={styles.hint}>Enter a number, tap an operator, then another number — every step gets logged here.</Text>
        ) : (
          steps.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
              <Text style={styles.stepText}>
                {s.type === 'start'
                  ? `Start with ${fmt(s.value)}.`
                  : `${fmt(s.a!)} ${s.opSymbol} ${fmt(s.b!)} = ${Number.isFinite(s.value) ? fmt(s.value) : 'Error'}`}
              </Text>
            </View>
          ))
        )}
      </View>

      <Text style={styles.sectionLabel}>Steps chart</Text>
      <View style={styles.chartCard}>
        <StepsChart steps={steps} />
        <Text style={styles.chartCaption}>
          {latestStep
            ? latestStep.type === 'start'
              ? `Start: ${fmt(latestStep.value)}`
              : `${fmt(latestStep.a!)} ${latestStep.opSymbol} ${fmt(latestStep.b!)} = ${fmt(latestStep.value)}`
            : 'Try 12 + 8 to see your steps plotted here.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18 },
  dojo: {
    backgroundColor: DOJO.panel,
    borderWidth: 2,
    borderColor: DOJO.panelBorder,
    borderRadius: theme.radius.lg,
    padding: 14,
    marginBottom: 6,
  },
  display: {
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 16,
  },
  expression: {
    fontSize: 13,
    fontFamily: theme.font.bodySemi,
    color: DOJO.mutedOnDark,
    minHeight: 16,
  },
  displayValue: {
    fontSize: 40,
    fontFamily: theme.font.display,
    color: DOJO.textOnDark,
  },
  keys: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  key: {
    width: '23%',
    aspectRatio: 1.2,
    backgroundColor: DOJO.tile,
    borderWidth: 1.5,
    borderColor: DOJO.tileBorder,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyWide: {
    width: '48.5%',
  },
  sectionLabel: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 13,
    fontFamily: theme.font.bodyExtraBold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: COLORS.textMuted,
  },
  breakdown: {
    backgroundColor: COLORS.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: 16,
    gap: 10,
  },
  hint: {
    fontSize: 13,
    fontFamily: theme.font.body,
    color: COLORS.textMuted,
    lineHeight: 19,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: theme.radius.pill,
    backgroundColor: COLORS.operator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 11.5,
    fontFamily: theme.font.bodyExtraBold,
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: theme.font.bodyBold,
    color: COLORS.text,
    marginTop: 1,
  },
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    paddingVertical: 10,
  },
  chartCaption: {
    marginTop: 6,
    fontSize: 12.5,
    fontFamily: theme.font.bodySemi,
    color: COLORS.textMuted,
  },
});

const keyVariantStyle: Record<KeyVariant, object> = StyleSheet.create({
  digit: {},
  fn: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 159, 69, 0.55)',
  },
  operator: {
    backgroundColor: theme.color.tangerine,
    borderColor: theme.color.tangerine,
  },
  equals: {
    backgroundColor: theme.color.mint,
    borderColor: theme.color.mint,
  },
});

const keyLabelStyle = StyleSheet.create({
  digit: {
    fontSize: 19,
    fontFamily: theme.font.bodyExtraBold,
    color: DOJO.textOnDark,
  },
  fn: {
    fontSize: 15,
    fontFamily: theme.font.bodyExtraBold,
    color: theme.color.tangerine,
  },
  operator: {
    fontSize: 21,
    fontFamily: theme.font.bodyExtraBold,
    color: '#FFFFFF',
  },
  equals: {
    fontSize: 23,
    fontFamily: theme.font.bodyExtraBold,
    color: theme.color.mintDark,
  },
});
