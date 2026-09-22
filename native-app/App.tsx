import { useFonts, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { CharacterSelectModal } from './src/components/CharacterSelectModal';
import Dashboard from './src/components/Dashboard';
import { WelcomeModal } from './src/components/WelcomeModal';
import { hydrateGameState, setCharacter, useGameState } from './src/utils/gameState';

// Fonts are a visual nicety, not something the app should ever hang on.
// If loading fails (or just never resolves, e.g. a blocked/slow asset host)
// we fall back to system fonts after a short grace period instead of
// spinning forever.
const FONT_TIMEOUT_MS = 4000;
const BG_VOID = '#0b0f19';

/**
 * A brand-new player (no `characterId` saved yet) sees a two-step
 * onboarding: a welcome popup, then a hero-selection popup. Once a hero is
 * picked, `characterId` is persisted and this gate never appears again —
 * `Dashboard` renders underneath the whole time so there's no separate
 * "loading the app" flash once onboarding finishes.
 */
function OnboardingGate() {
  const hero = useGameState();
  const [step, setStep] = useState<'welcome' | 'select' | null>(null);
  // useGameState() returns its default (characterId: null) synchronously
  // before AsyncStorage hydration resolves — without this guard, a
  // returning player with a saved character would see the welcome popup
  // flash for a frame before hydration corrects it.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrateGameState().then(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (hero.characterId === null) setStep((current) => current ?? 'welcome');
    else setStep(null);
  }, [hydrated, hero.characterId]);

  return (
    <>
      <WelcomeModal visible={step === 'welcome'} onContinue={() => setStep('select')} />
      <CharacterSelectModal
        visible={step === 'select'}
        onSelect={(characterId) => {
          setCharacter(characterId);
          setStep(null);
        }}
      />
    </>
  );
}

// Several stages (Circle Spinner's holds, Limit Chaser's holds, every tap
// widget in AnswerWidgets.tsx) are built around press-and-hold or fast
// repeated taps. On web, React Native's own components don't disable text
// selection or the mobile tap-highlight box the way native platforms do by
// default, so those same gestures can leave a lingering browser text
// selection or a flashed highlight rectangle behind — cosmetic, but not
// something a real game screen should ever show. Injected once, globally,
// rather than per-component, since it's a browser-chrome concern, not a
// per-widget one.
function useDisableWebSelectionArtifacts() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-user-select: none;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
}

export default function App() {
  useDisableWebSelectionArtifacts();
  const [fontsLoaded, fontError] = useFonts({
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), FONT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  const ready = fontsLoaded || !!fontError || timedOut;

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#9D4EDD" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Dashboard />
      </ScrollView>
      <OnboardingGate />
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_VOID,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BG_VOID,
  },
});
