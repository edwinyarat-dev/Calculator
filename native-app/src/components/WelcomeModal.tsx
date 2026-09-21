import { Hourglass } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { DL_COLORS } from '../features/deep-learning/theme';

export interface WelcomeModalProps {
  visible: boolean;
  onContinue: () => void;
}

/**
 * The very first thing a brand-new player sees — a one-time greeting before
 * `CharacterSelectModal`. Not dismissible by tapping outside or the Android
 * back button (`onRequestClose` is a no-op): picking a hero is a required
 * first step, not an optional popup.
 */
export function WelcomeModal({ visible, onContinue }: WelcomeModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.logoMark}>
            <Hourglass size={30} color={DL_COLORS.amethyst} strokeWidth={2.2} />
          </View>
          <Text style={styles.wordmark}>MathQuest</Text>
          <Text style={styles.subtitle}>Chronomancer</Text>
          <Text style={styles.greeting}>Hello, welcome to MathQuest!</Text>
          <Text style={styles.body}>
            Somewhere between one heartbeat and the next, time has sprung a leak — and only a Chronomancer's apprentice
            can mend it. Six fractured realms are waiting, each guarded by a creature born from a broken piece of math.
            Master them, and you master time itself.
          </Text>
          <Pressable
            style={styles.continueButton}
            onPress={onContinue}
            accessibilityRole="button"
            accessibilityLabel="Continue to hero selection"
          >
            <Text style={styles.continueButtonText}>Continue ➔</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default WelcomeModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 9, 18, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: DL_COLORS.surface,
    borderWidth: 2,
    borderColor: DL_COLORS.amethyst,
    borderRadius: 26,
    padding: 28,
    alignItems: 'center',
    gap: 8,
    shadowColor: DL_COLORS.amethyst,
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 14,
  },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: DL_COLORS.amethystGlow,
    backgroundColor: DL_COLORS.amethystSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  wordmark: {
    fontSize: 22,
    fontWeight: '800',
    color: DL_COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: DL_COLORS.amethyst,
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 10,
  },
  greeting: {
    fontSize: 17,
    fontWeight: '800',
    color: DL_COLORS.text,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    fontWeight: '600',
    color: DL_COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 2,
  },
  continueButton: {
    marginTop: 18,
    backgroundColor: DL_COLORS.amethyst,
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
