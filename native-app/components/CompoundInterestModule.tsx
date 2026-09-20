import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Slider from '@react-native-community/slider';
import Svg, { Line, Path } from 'react-native-svg';
import { theme } from '../theme';

const COLORS = {
  surface: theme.color.surface,
  border: theme.color.border,
  text: theme.color.text,
  textMuted: theme.color.textMuted,
  accent: theme.color.sunshineDark,
};

const nf = new Intl.NumberFormat('en-US');
function fmtMoney(n: number): string {
  if (!Number.isFinite(n)) return '$0';
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

const FREQUENCIES: { label: string; value: number }[] = [
  { label: 'Annually', value: 1 },
  { label: 'Quarterly', value: 4 },
  { label: 'Monthly', value: 12 },
  { label: 'Daily', value: 365 },
];

function compoundAmount(principal: number, ratePct: number, years: number, freq: number): number {
  const r = ratePct / 100;
  return principal * Math.pow(1 + r / freq, freq * years);
}

const CHART_W = 300;
const CHART_H = 170;
const PAD_L = 44;
const PAD_R = 14;
const PAD_T = 14;
const PAD_B = 24;

function BalanceChart({ principal, rate, years, freq }: { principal: number; rate: number; years: number; freq: number }) {
  const points = useMemo(() => {
    const pts = [];
    for (let y = 0; y <= years; y++) pts.push({ x: y, y: compoundAmount(principal, rate, y, freq) });
    return pts;
  }, [principal, rate, years, freq]);

  const plotW = CHART_W - PAD_L - PAD_R;
  const plotH = CHART_H - PAD_T - PAD_B;
  const yMax = Math.max(...points.map((p) => p.y), 1) * 1.15;

  const sx = (x: number) => PAD_L + (x / (years || 1)) * plotW;
  const sy = (y: number) => PAD_T + plotH - (y / (yMax || 1)) * plotH;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.x)},${sy(p.y)}`).join(' ');
  const areaPath = `M${sx(0)},${sy(0)} ${points.map((p) => `L${sx(p.x)},${sy(p.y)}`).join(' ')} L${sx(years)},${sy(0)} Z`;

  return (
    <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`} role="img" accessibilityLabel="Balance growth over time">
      <Line x1={PAD_L} y1={sy(0)} x2={CHART_W - PAD_R} y2={sy(0)} stroke={COLORS.border} strokeWidth={1.5} />
      <Path d={areaPath} fill={COLORS.accent} fillOpacity={0.15} stroke="none" />
      <Path d={linePath} fill="none" stroke={COLORS.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function CompoundInterestModule() {
  const [principalText, setPrincipalText] = useState('1000');
  const [rate, setRate] = useState(5);
  const [years, setYears] = useState(10);
  const [freq, setFreq] = useState(12);

  const principal = Math.max(0, Number(principalText) || 0);
  const finalAmount = compoundAmount(principal, rate, years, freq);
  const gain = finalAmount - principal;
  const perPeriodFactor = 1 + (rate / 100) / freq;
  const totalPeriods = freq * years;
  const freqLabel = FREQUENCIES.find((f) => f.value === freq)?.label.toLowerCase() ?? 'monthly';

  return (
    <View style={styles.container}>
      <Text style={styles.fieldLabel}>Principal</Text>
      <View style={styles.principalRow}>
        <Text style={styles.principalPrefix}>$</Text>
        <TextInput
          style={styles.principalInput}
          value={principalText}
          onChangeText={setPrincipalText}
          keyboardType="numeric"
          accessibilityLabel="Principal amount"
        />
      </View>

      <Text style={styles.fieldLabel}>Annual interest rate: {rate.toFixed(1)}%</Text>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={20}
        step={0.1}
        value={rate}
        onValueChange={setRate}
        minimumTrackTintColor={COLORS.accent}
        maximumTrackTintColor={COLORS.border}
        thumbTintColor={COLORS.accent}
        accessibilityLabel="Annual interest rate"
      />

      <Text style={styles.fieldLabel}>Time period: {years} year{years === 1 ? '' : 's'}</Text>
      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={40}
        step={1}
        value={years}
        onValueChange={setYears}
        minimumTrackTintColor={COLORS.accent}
        maximumTrackTintColor={COLORS.border}
        thumbTintColor={COLORS.accent}
        accessibilityLabel="Time period in years"
      />

      <Text style={styles.fieldLabel}>Compounding frequency</Text>
      <View style={styles.freqRow}>
        {FREQUENCIES.map((f) => (
          <Pressable
            key={f.value}
            onPress={() => setFreq(f.value)}
            style={[styles.freqBtn, freq === f.value && styles.freqBtnActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: freq === f.value }}
          >
            <Text style={[styles.freqBtnLabel, freq === f.value && styles.freqBtnLabelActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statTile}>
          <Text style={styles.statLabel}>Final balance</Text>
          <Text style={styles.statValue}>{fmtMoney(finalAmount)}</Text>
        </View>
        <View style={styles.statTile}>
          <Text style={styles.statLabel}>Interest earned</Text>
          <Text style={styles.statValue}>{fmtMoney(gain)}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Step-by-step breakdown</Text>
      <View style={styles.breakdown}>
        <StepRow n={1} text={`Principal P = ${fmtMoney(principal)}, annual rate r = ${rate.toFixed(1)}%, compounded ${freqLabel} (n = ${freq}), for t = ${years} year${years === 1 ? '' : 's'}.`} />
        <StepRow n={2} text={`Each period the balance is multiplied by (1 + r/n) ≈ ${perPeriodFactor.toFixed(6)}.`} />
        <StepRow n={3} text={`Total compounding periods = n × t = ${freq} × ${years} = ${totalPeriods}.`} />
        <StepRow n={4} text={`A = P(1 + r/n)^(nt) = ${fmtMoney(principal)} × ${perPeriodFactor.toFixed(6)}^${totalPeriods} ≈ ${fmtMoney(finalAmount)}.`} />
        <StepRow n={5} text={`You earned ${fmtMoney(gain)} in interest — a ${principal > 0 ? ((gain / principal) * 100).toFixed(1) : '0'}% increase.`} />
      </View>

      <Text style={styles.sectionLabel}>Balance over time</Text>
      <View style={styles.chartCard}>
        <BalanceChart principal={principal} rate={rate} years={years} freq={freq} />
        <Text style={styles.chartCaption}>Year {years}: {fmtMoney(finalAmount)}</Text>
      </View>
    </View>
  );
}

function StepRow({ n, text }: { n: number; text: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNum}><Text style={styles.stepNumText}>{n}</Text></View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18 },
  fieldLabel: {
    fontSize: 13,
    fontFamily: theme.font.bodyExtraBold,
    color: COLORS.textMuted,
    marginTop: 14,
    marginBottom: 8,
  },
  principalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
  },
  principalPrefix: {
    fontSize: 16,
    fontFamily: theme.font.bodyBold,
    color: COLORS.textMuted,
    marginRight: 4,
  },
  principalInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.font.bodyExtraBold,
    color: COLORS.text,
    paddingVertical: 12,
  },
  slider: {
    width: '100%',
    height: 36,
  },
  freqRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  freqBtn: {
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  freqBtnActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  freqBtnLabel: {
    fontSize: 13,
    fontFamily: theme.font.bodyBold,
    color: COLORS.text,
  },
  freqBtnLabelActive: {
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  statTile: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: theme.radius.md,
    padding: 12,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: theme.font.bodyExtraBold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: COLORS.textMuted,
  },
  statValue: {
    marginTop: 4,
    fontSize: 18,
    fontFamily: theme.font.display,
    color: COLORS.text,
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
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: theme.radius.pill,
    backgroundColor: COLORS.accent,
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
    fontSize: 13,
    fontFamily: theme.font.bodySemi,
    color: COLORS.text,
    lineHeight: 18,
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
