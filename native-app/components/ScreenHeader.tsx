import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

interface ScreenHeaderProps {
  emoji: string;
  title: string;
  blurb: string;
  accent: string;
  onBack: () => void;
}

export default function ScreenHeader({ emoji, title, blurb, accent, onBack }: ScreenHeaderProps) {
  return (
    <View style={[styles.container, { backgroundColor: accent }]}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        accessibilityRole="button"
        accessibilityLabel="Back to home"
      >
        <Text style={styles.backArrow}>←</Text>
      </Pressable>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.blurb}>{blurb}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: theme.radius.lg,
    borderBottomRightRadius: theme.radius.lg,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 22,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    transform: [{ scale: 0.94 }],
  },
  backArrow: {
    fontSize: 18,
    fontFamily: theme.font.bodyExtraBold,
    color: theme.color.textOnDark,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: theme.font.display,
    color: theme.color.textOnDark,
  },
  blurb: {
    marginTop: 4,
    fontSize: 13.5,
    fontFamily: theme.font.bodySemi,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
});
