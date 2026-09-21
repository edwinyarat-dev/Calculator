import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DL_COLORS } from '../features/deep-learning/theme';
import { MODULES, ModuleKey } from '../../theme';
import { useGameState } from '../utils/gameState';

export interface RealmViewportProps {
  activeRealm: ModuleKey;
  onSelectRealm: (key: ModuleKey) => void;
}

/** The world map: a horizontal strip of realm cards, one per math module, showing cleared/active state. */
export function RealmViewport({ activeRealm, onSelectRealm }: RealmViewportProps) {
  const hero = useGameState();

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>World Map</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {MODULES.map((mod) => {
          const isActive = mod.key === activeRealm;
          const isCleared = hero.clearedRealms.includes(mod.key);
          return (
            <Pressable
              key={mod.key}
              onPress={() => onSelectRealm(mod.key)}
              accessibilityRole="button"
              accessibilityLabel={`Realm: ${mod.title}${isCleared ? ', cleared' : ''}${isActive ? ', active' : ''}`}
              style={[styles.realmCard, isActive && styles.realmCardActive, isCleared && styles.realmCardCleared]}
            >
              <Text style={styles.realmEmoji}>{mod.emoji}</Text>
              <Text style={styles.realmTitle} numberOfLines={1}>{mod.title}</Text>
              {isCleared && <Text style={styles.clearedBadge}>✓ Cleared</Text>}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default RealmViewport;

const styles = StyleSheet.create({
  card: {
    backgroundColor: DL_COLORS.surface,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: DL_COLORS.border,
    padding: 14,
  },
  heading: {
    fontSize: 11,
    fontWeight: '800',
    color: DL_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 10,
  },
  row: {
    gap: 10,
  },
  realmCard: {
    width: 110,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: DL_COLORS.border,
    backgroundColor: DL_COLORS.surfaceMuted,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  realmCardActive: {
    borderColor: DL_COLORS.amethyst,
    backgroundColor: DL_COLORS.amethystSoft,
    shadowColor: DL_COLORS.amethyst,
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  realmCardCleared: {
    borderColor: DL_COLORS.lime,
  },
  realmEmoji: {
    fontSize: 26,
  },
  realmTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: DL_COLORS.text,
    textAlign: 'center',
  },
  clearedBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: DL_COLORS.lime,
  },
});
