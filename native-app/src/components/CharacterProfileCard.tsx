import { Sparkles } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DL_COLORS } from '../features/deep-learning/theme';
import { MODULES } from '../../theme';
import { useGameState, xpProgress } from '../utils/gameState';

/** The left-column HUD card: avatar, title/level, live XP bar, and realms-cleared progress. */
export function CharacterProfileCard() {
  const hero = useGameState();
  const { current, span } = xpProgress(hero);
  const pct = Math.min(100, (current / span) * 100);
  const totalRealms = MODULES.length;

  return (
    <View style={styles.card}>
      <View style={styles.avatarRing}>
        <Text style={styles.avatarEmoji}>🧙</Text>
      </View>
      <Text style={styles.title}>{hero.title}</Text>
      <Text style={styles.level}>Level {hero.level}</Text>

      <View style={styles.xpBarTrack}>
        <View style={[styles.xpBarFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.xpBarLabel}>
        {current} / {span} XP to Level {hero.level + 1}
      </Text>

      <View style={styles.statsBlock}>
        <View style={styles.statRow}>
          <Sparkles size={14} color={DL_COLORS.lime} strokeWidth={2.5} />
          <Text style={styles.statLabel}>Chrono-Shards</Text>
          <Text style={styles.statValue}>{hero.totalXp}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statCheck}>✓</Text>
          <Text style={styles.statLabel}>Realms Cleared</Text>
          <Text style={styles.statValue}>
            {hero.clearedRealms.length}/{totalRealms}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default CharacterProfileCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: DL_COLORS.surface,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: DL_COLORS.border,
    padding: 18,
    alignItems: 'center',
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: DL_COLORS.amethyst,
    backgroundColor: DL_COLORS.amethystSoft,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: DL_COLORS.amethyst,
    shadowOpacity: 0.7,
    shadowRadius: 10,
    marginBottom: 8,
  },
  avatarEmoji: {
    fontSize: 34,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: DL_COLORS.amethyst,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  level: {
    fontSize: 20,
    fontWeight: '800',
    color: DL_COLORS.text,
    marginTop: 2,
    marginBottom: 10,
  },
  xpBarTrack: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    backgroundColor: DL_COLORS.surfaceMuted,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: DL_COLORS.lime,
    shadowColor: DL_COLORS.lime,
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },
  xpBarLabel: {
    fontSize: 11,
    color: DL_COLORS.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
  statsBlock: {
    width: '100%',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: DL_COLORS.border,
    paddingTop: 12,
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statCheck: {
    fontSize: 13,
    color: DL_COLORS.lime,
    fontWeight: '800',
    width: 14,
    textAlign: 'center',
  },
  statLabel: {
    flex: 1,
    fontSize: 11.5,
    color: DL_COLORS.textMuted,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '800',
    color: DL_COLORS.text,
  },
});
