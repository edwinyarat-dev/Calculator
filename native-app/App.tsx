import { useFonts, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import CalculusLimitVisualizer from './components/CalculusLimitVisualizer';
import DataStatisticsModule from './components/DataStatisticsModule';
import ScreenHeader from './components/ScreenHeader';
import TrigonometryUnitCircle from './components/TrigonometryUnitCircle';
import HomeScreen from './screens/HomeScreen';
import { MODULES, ModuleKey, theme } from './theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  const [screen, setScreen] = useState<ModuleKey | 'home'>('home');

  if (!fontsLoaded) {
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
