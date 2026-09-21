import { Sparkles, Trophy } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { DL_COLORS } from '../features/deep-learning/theme';
import { HERO_IDENTITY, MODULES } from '../../theme';
import { useGameState, xpProgress } from '../utils/gameState';
import { CharacterDetailModal } from './CharacterDetailModal';

/** The left-column HUD card: portrait, name/title/level, live XP bar, and realms-cleared progress. Tapping the portrait opens a detail popup explaining who she is and what her level/XP represent. */
export function CharacterProfileCard() {
  const hero = useGameState();
  const { current, span } = xpProgress(hero);
  const pct = Math.min(100, (current / span) * 100);
  const totalRealms = MODULES.length;
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <View style={styles.card}>
      <Pressable
        style={styles.portraitFrame}
        onPress={() => setDetailOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`View ${HERO_IDENTITY.name}'s character details`}
      >
        <Text style={styles.portraitEmoji}>{HERO_IDENTITY.emoji}</Text>
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>{hero.level}</Text>
        </View>
      </Pressable>

      <Text style={styles.title}>{hero.title}</Text>
      <Text style={styles.heroName}>{HERO_IDENTITY.name}</Text>

      <CharacterDetailModal
        visible={detailOpen}
        onClose={() => setDetailOpen(false)}
        emoji={HERO_IDENTITY.emoji}
        name={HERO_IDENTITY.name}
        subtitle={`Level ${hero.level} ${hero.title}`}
        purpose={HERO_IDENTITY.purpose}
        accentColor={DL_COLORS.amethyst}
      />

      <View style={styles.statBar}>
        <View style={styles.statBarHeader}>
          <View style={styles.statBarLabelRow}>
            <Sparkles size={12} color={DL_COLORS.amethyst} strokeWidth={2.5} />
            <Text style={styles.statBarLabel}>XP to Lv {hero.level + 1}</Text>
          </View>
          <Text style={styles.statBarValue}>
            {current} <Text style={styles.statBarValueMuted}>/ {span}</Text>
          </Text>
        </View>
        <View style={styles.statBarTrack}>
          <View style={[styles.statBarFillWrap, { width: `${pct}%` }]}>
            <Svg width={220} height="100%" style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="xpGradient" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0%" stopColor={DL_COLORS.amethyst} />
                  <Stop offset="100%" stopColor="#E879F9" />
                </LinearGradient>
              </Defs>
              <Rect x={0} y={0} width="100%" height="100%" fill="url(#xpGradient)" />
            </Svg>
          </View>
        </View>
      </View>

      <View style={styles.statsBlock}>
        <View style={styles.statRow}>
          <Sparkles size={14} color={DL_COLORS.lime} strokeWidth={2.5} />
          <Text style={styles.statLabel}>Chrono-Shards</Text>
          <Text style={styles.statValue}>{hero.totalXp}</Text>
        </View>
        <View style={styles.statRow}>
          <Trophy size={14} color={DL_COLORS.lime} strokeWidth={2.5} />
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
  portraitFrame: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 180,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: DL_COLORS.amethyst,
    backgroundColor: DL_COLORS.amethystSoft,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: DL_COLORS.amethyst,
    shadowOpacity: 0.7,
    shadowRadius: 16,
    marginBottom: 10,
  },
  portraitEmoji: {
    fontSize: 68,
  },
  levelBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: DL_COLORS.amethystGlow,
    backgroundColor: DL_COLORS.bgDeep,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: DL_COLORS.amethyst,
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  levelBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: DL_COLORS.amethyst,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: DL_COLORS.amethyst,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  heroName: {
    fontSize: 19,
    fontWeight: '800',
    color: DL_COLORS.text,
    marginTop: 2,
    marginBottom: 12,
  },
  statBar: {
    width: '100%',
  },
  statBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statBarLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statBarLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: DL_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statBarValue: {
    fontSize: 11,
    fontWeight: '800',
    color: DL_COLORS.text,
  },
  statBarValueMuted: {
    color: DL_COLORS.textMuted,
    fontWeight: '600',
  },
  statBarTrack: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    backgroundColor: DL_COLORS.surfaceMuted,
    overflow: 'hidden',
  },
  statBarFillWrap: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
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
