import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { theme } from '../theme';

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
          <React.Fragment key={i}>
            <Line
              x1={sx(p.x)} y1={sy(p.y)} x2={sx(p.x)} y2={sy(p.y)}
              stroke={isLast ? COLORS.equalsDark : COLORS.operator}
              strokeWidth={isLast ? 9 : 7}
              strokeLinecap="round"
            />
          </React.Fragment>
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
      <View style={styles.display}>
        <Text style={styles.expression}>{expression}</Text>
        <Text style={styles.displayValue}>{displayValue}</Text>
      </View>

      <View style={styles.keys}>
        <Pressable style={[styles.key, styles.keyFn]} onPress={clearAll}><Text style={styles.keyFnLabel}>AC</Text></Pressable>
        <Pressable style={[styles.key, styles.keyFn]} onPress={backspace}><Text style={styles.keyFnLabel}>⌫</Text></Pressable>
        <Pressable style={[styles.key, styles.keyFn]} onPress={percent}><Text style={styles.keyFnLabel}>%</Text></Pressable>
        <Pressable style={[styles.key, styles.keyOp]} onPress={() => setOp('÷')}><Text style={styles.keyOpLabel}>÷</Text></Pressable>

        {(['7', '8', '9'] as const).map((d) => (
          <Pressable key={d} style={styles.key} onPress={() => inputDigit(d)}><Text style={styles.keyLabel}>{d}</Text></Pressable>
        ))}
        <Pressable style={[styles.key, styles.keyOp]} onPress={() => setOp('×')}><Text style={styles.keyOpLabel}>×</Text></Pressable>

        {(['4', '5', '6'] as const).map((d) => (
          <Pressable key={d} style={styles.key} onPress={() => inputDigit(d)}><Text style={styles.keyLabel}>{d}</Text></Pressable>
        ))}
        <Pressable style={[styles.key, styles.keyOp]} onPress={() => setOp('−')}><Text style={styles.keyOpLabel}>−</Text></Pressable>

        {(['1', '2', '3'] as const).map((d) => (
          <Pressable key={d} style={styles.key} onPress={() => inputDigit(d)}><Text style={styles.keyLabel}>{d}</Text></Pressable>
        ))}
        <Pressable style={[styles.key, styles.keyOp]} onPress={() => setOp('+')}><Text style={styles.keyOpLabel}>+</Text></Pressable>

        <Pressable style={[styles.key, styles.keyZero]} onPress={() => inputDigit('0')}><Text style={styles.keyLabel}>0</Text></Pressable>
        <Pressable style={styles.key} onPress={inputDecimal}><Text style={styles.keyLabel}>.</Text></Pressable>
        <Pressable style={[styles.key, styles.keyEquals]} onPress={evaluate}><Text style={styles.keyEqualsLabel}>=</Text></Pressable>
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
  display: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: theme.radius.lg,
    padding: 18,
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  expression: {
    fontSize: 13,
    fontFamily: theme.font.bodySemi,
    color: COLORS.textMuted,
    minHeight: 16,
  },
  displayValue: {
    fontSize: 34,
    fontFamily: theme.font.display,
    color: COLORS.text,
  },
  keys: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  key: {
    width: '23%',
    aspectRatio: 1.3,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyZero: {
    width: '48.5%',
  },
  keyFn: {
    backgroundColor: theme.color.surfaceMuted,
  },
  keyOp: {
    backgroundColor: COLORS.operator,
    borderColor: COLORS.operator,
  },
  keyEquals: {
    backgroundColor: COLORS.equals,
    borderColor: COLORS.equals,
  },
  keyLabel: {
    fontSize: 18,
    fontFamily: theme.font.bodyExtraBold,
    color: COLORS.text,
  },
  keyFnLabel: {
    fontSize: 15,
    fontFamily: theme.font.bodyExtraBold,
    color: COLORS.textMuted,
  },
  keyOpLabel: {
    fontSize: 20,
    fontFamily: theme.font.bodyExtraBold,
    color: '#FFFFFF',
  },
  keyEqualsLabel: {
    fontSize: 22,
    fontFamily: theme.font.bodyExtraBold,
    color: COLORS.equalsDark,
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
