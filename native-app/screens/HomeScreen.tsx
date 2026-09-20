import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MODULES, ModuleKey, theme } from '../theme';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning, mathlete! ☀️';
  if (hour < 18) return 'Good afternoon, mathlete! 👋';
  return 'Good evening, mathlete! 🌙';
}

interface HomeScreenProps {
  onSelect: (key: ModuleKey) => void;
}

export default function HomeScreen({ onSelect }: HomeScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>{getGreeting()}</Text>
      <Text style={styles.title}>MathQuest 🎲</Text>
      <Text style={styles.subtitle}>Pick a quest and play with the math — no worksheets, just sliders and shapes.</Text>

      <View style={styles.cards}>
        {MODULES.map((mod) => (
          <Pressable
            key={mod.key}
            onPress={() => onSelect(mod.key)}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: mod.accent },
              pressed && styles.cardPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Open ${mod.title}`}
          >
            <Text style={styles.cardEmoji}>{mod.emoji}</Text>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>{mod.title}</Text>
              <Text style={styles.cardBlurb}>{mod.blurb}</Text>
            </View>
            <View style={styles.cardPlayBadge}>
              <Text style={styles.cardPlayText}>PLAY</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 32,
  },
  greeting: {
    fontSize: 14,
    fontFamily: theme.font.bodyBold,
    color: theme.color.textMuted,
  },
  title: {
    marginTop: 4,
    fontSize: 32,
    fontFamily: theme.font.display,
    color: theme.color.text,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    fontSize: 14.5,
    fontFamily: theme.font.body,
    color: theme.color.textMuted,
    lineHeight: 20,
  },
  cards: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.lg,
    padding: 18,
    shadowColor: '#2B2250',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
  },
  cardEmoji: {
    fontSize: 40,
    marginRight: 14,
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 19,
    fontFamily: theme.font.display,
    color: theme.color.textOnDark,
  },
  cardBlurb: {
    marginTop: 2,
    fontSize: 12.5,
    fontFamily: theme.font.bodySemi,
    color: 'rgba(255,255,255,0.9)',
  },
  cardPlayBadge: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cardPlayText: {
    fontSize: 11,
    fontFamily: theme.font.bodyExtraBold,
    letterSpacing: 0.5,
    color: theme.color.text,
  },
});
