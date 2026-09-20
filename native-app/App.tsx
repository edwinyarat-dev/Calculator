import { useFonts, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import ArithmeticModule from './components/ArithmeticModule';
import CalculusLimitVisualizer from './components/CalculusLimitVisualizer';
import CompoundInterestModule from './components/CompoundInterestModule';
import DataStatisticsModule from './components/DataStatisticsModule';
import GeometryModule from './components/GeometryModule';
import ScreenHeader from './components/ScreenHeader';
import TrigonometryUnitCircle from './components/TrigonometryUnitCircle';
import HomeScreen from './screens/HomeScreen';
import { MODULES, ModuleKey, theme } from './theme';

// Fonts are a visual nicety, not something the app should ever hang on.
// If loading fails (or just never resolves, e.g. a blocked/slow asset host)
// we fall back to system fonts after a short grace period instead of
// spinning forever.
const FONT_TIMEOUT_MS = 4000;

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  const [timedOut, setTimedOut] = useState(false);
  const [screen, setScreen] = useState<ModuleKey | 'home'>('home');

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), FONT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  const ready = fontsLoaded || !!fontError || timedOut;

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.color.coral} size="large" />
      </View>
    );
  }

  const activeModule = MODULES.find((m) => m.key === screen);

  return (
    <SafeAreaView style={styles.safeArea}>
      {screen === 'home' ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <HomeScreen onSelect={setScreen} />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} stickyHeaderIndices={[0]}>
          <ScreenHeader
            emoji={activeModule!.emoji}
            title={activeModule!.title}
            blurb={activeModule!.blurb}
            accent={activeModule!.accent}
            onBack={() => setScreen('home')}
          />
          {screen === 'arithmetic' && <ArithmeticModule />}
          {screen === 'compoundInterest' && <CompoundInterestModule />}
          {screen === 'geometry' && <GeometryModule />}
          {screen === 'statistics' && <DataStatisticsModule />}
          {screen === 'trigonometry' && <TrigonometryUnitCircle />}
          {screen === 'calculus' && <CalculusLimitVisualizer />}
        </ScrollView>
      )}
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.color.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.background,
  },
});
