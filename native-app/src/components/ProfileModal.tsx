import { Flame, Sparkles, Target, Trophy, User } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { getHeroCharacter, MODULES } from '../../theme';
import { DL_COLORS } from '../features/deep-learning/theme';
import { BADGES, heroAccuracyPct, useGameState, xpProgress } from '../utils/gameState';

export interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Quick-access profile popup opened from the header's profile logo — the same
 * identity, XP progress, and stats `CharacterProfileCard` shows in the sidebar,
 * just reachable in one tap wherever the player scrolls to on narrower layouts.
 */
export function ProfileModal({ visible, onClose }: ProfileModalProps) {
  const hero = useGameState();
  const heroCharacter = getHeroCharacter(hero.characterId);
  const { current, span } = xpProgress(hero);
  const pct = Math.min(100, (current / span) * 100);
  const totalRealms = MODULES.length;
  const accuracyPct = heroAccuracyPct(hero);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <User size={20} color={DL_COLORS.amethyst} strokeWidth={2.2} />
              <Text style={styles.heading}>Profile</Text>
            </View>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close profile" style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.portraitFrame}>
            <Text style={styles.portraitEmoji}>{heroCharacter.emoji}</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{hero.level}</Text>
            </View>
          </View>
          <Text style={styles.title}>{hero.title}</Text>
          <Text style={styles.heroName}>{heroCharacter.name}</Text>

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
                    <LinearGradient id="profileXpGradient" x1="0" y1="0" x2="1" y2="0">
                      <Stop offset="0%" stopColor={DL_COLORS.amethyst} />
                      <Stop offset="100%" stopColor="#E879F9" />
                    </LinearGradient>
                  </Defs>
                  <Rect x={0} y={0} width="100%" height="100%" fill="url(#profileXpGradient)" />
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
            <View style={styles.statRow}>
              <Target size={14} color={DL_COLORS.lime} strokeWidth={2.5} />
              <Text style={styles.statLabel}>Overall Accuracy</Text>
              <Text style={styles.statValue}>{accuracyPct}%</Text>
            </View>
            <View style={styles.statRow}>
              <Flame size={14} color={DL_COLORS.lime} strokeWidth={2.5} />
              <Text style={styles.statLabel}>Best Streak</Text>
              <Text style={styles.statValue}>{hero.bestStreakEver}x</Text>
            </View>
          </View>

          {hero.badges.length > 0 && (
            <View style={styles.badgesBlock}>
              <Text style={styles.badgesHeading}>Badges</Text>
              <View style={styles.badgesRow}>
                {BADGES.filter((b) => hero.badges.includes(b.id)).map((b) => (
                  <View key={b.id} style={styles.badgePill} accessibilityLabel={`Badge earned: ${b.label} — ${b.description}`}>
                    <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                    <Text style={styles.badgeLabel}>{b.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Pressable style={styles.closeCardButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close profile">
            <Text style={styles.closeCardButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default ProfileModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 9, 18, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '90%',
    backgroundColor: DL_COLORS.surface,
    borderWidth: 2,
    borderColor: DL_COLORS.amethyst,
    borderRadius: 24,
    padding: 22,
    gap: 4,
    alignItems: 'center',
    shadowColor: DL_COLORS.amethyst,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heading: {
    fontSize: 16,
    fontWeight: '800',
    color: DL_COLORS.text,
  },
  closeButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: DL_COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: DL_COLORS.textMuted,
  },
  portraitFrame: {
    width: '100%',
    aspectRatio: 1.8,
    maxWidth: 160,
    maxHeight: 100,
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
    fontSize: 48,
  },
  levelBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
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
    fontSize: 12,
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
    fontSize: 18,
    fontWeight: '800',
    color: DL_COLORS.text,
    marginTop: 2,
    marginBottom: 14,
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
  badgesBlock: {
    width: '100%',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: DL_COLORS.border,
    paddingTop: 12,
    gap: 8,
  },
  badgesHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: DL_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: DL_COLORS.amethyst,
    backgroundColor: DL_COLORS.amethystSoft,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeEmoji: {
    fontSize: 12,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: DL_COLORS.amethyst,
  },
  closeCardButton: {
    marginTop: 18,
    alignSelf: 'center',
    borderWidth: 1.5,
    borderColor: DL_COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  closeCardButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: DL_COLORS.textMuted,
  },
});
