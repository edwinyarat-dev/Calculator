import { Gem, Hourglass, Store as StoreIcon, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { getHeroCharacter, MODULES, ModuleKey } from '../../theme';
import { DL_COLORS } from '../features/deep-learning/theme';
import { useGameState } from '../utils/gameState';
import { CharacterProfileCard } from './CharacterProfileCard';
import { KineticStage } from './KineticStage';
import { ProfileModal } from './ProfileModal';
import { RealmViewport } from './RealmViewport';
import { StoreModal } from './StoreModal';

// Picks the next realm to jump to after clearing one: the next module after
// the current one in the fixed MODULES order, skipping any already cleared,
// wrapping back around to the start. Realms are never locked (see the
// RealmViewport comment), so "next" just means "the next thing worth doing" —
// if every realm is already cleared, it falls back to the following one in
// order so "Continue" still goes somewhere for a post-finale replay.
function pickNextRealm(current: ModuleKey, clearedRealms: string[]): ModuleKey {
  const currentIndex = MODULES.findIndex((mod) => mod.key === current);
  for (let step = 1; step <= MODULES.length; step++) {
    const candidate = MODULES[(currentIndex + step) % MODULES.length];
    if (!clearedRealms.includes(candidate.key)) return candidate.key;
  }
  return MODULES[(currentIndex + 1) % MODULES.length].key;
}

// Matches the v0-designed "MathQuest / Chronomancer" HUD layout, rebuilt in
// React Native: a top bar with a Chrono-Shards counter, then a responsive
// grid — 1 part character profile, 3 parts world map + active game.
// React Native has no CSS blur filter, so the ambient background glow is
// approximated with large, softly-shadowed translucent circles rather than
// a true Gaussian blur.

const SIDEBAR_BREAKPOINT = 900;
const BG_VOID = '#0b0f19';

function AmbientGlow() {
  return (
    <View style={styles.glowLayer} pointerEvents="none">
      <View style={[styles.glowCircle, styles.glowCircleTopLeft, { backgroundColor: DL_COLORS.amethystSoft }]} />
      <View style={[styles.glowCircle, styles.glowCircleBottomRight, { backgroundColor: DL_COLORS.limeSoft }]} />
    </View>
  );
}

function HudHeader() {
  const hero = useGameState();
  const heroCharacter = getHeroCharacter(hero.characterId);
  const [showStore, setShowStore] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.logoMark}>
          <Hourglass size={20} color={DL_COLORS.amethyst} strokeWidth={2.2} />
        </View>
        <View>
          <Text style={styles.wordmark}>MathQuest</Text>
          <Text style={styles.subtitle}>Chronomancer</Text>
        </View>
      </View>
      <View style={styles.headerRight}>
        <View style={styles.shardsPill}>
          <Gem size={16} color={DL_COLORS.amethyst} strokeWidth={2.2} />
          <Text style={styles.shardsValue}>{hero.totalXp.toLocaleString()}</Text>
          <Text style={styles.shardsLabel}>Chrono-Shards</Text>
        </View>
        <Pressable
          onPress={() => setShowProfile(true)}
          style={styles.profileButton}
          accessibilityRole="button"
          accessibilityLabel={`Open ${heroCharacter.name}'s profile`}
        >
          <Text style={styles.profileButtonEmoji}>{heroCharacter.emoji}</Text>
        </Pressable>
        <Pressable
          onPress={() => setShowStore(true)}
          style={styles.storeButton}
          accessibilityRole="button"
          accessibilityLabel="Open the Chrono Shop"
        >
          <StoreIcon size={18} color={DL_COLORS.reward} strokeWidth={2.2} />
        </Pressable>
      </View>
      <ProfileModal visible={showProfile} onClose={() => setShowProfile(false)} />
      <StoreModal visible={showStore} onClose={() => setShowStore(false)} chronoShards={hero.totalXp} />
    </View>
  );
}

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const isWide = width >= SIDEBAR_BREAKPOINT;
  const [activeRealm, setActiveRealm] = useState<ModuleKey>('arithmetic');
  const hero = useGameState();

  function handleNextRealm() {
    setActiveRealm((current) => pickNextRealm(current, hero.clearedRealms));
  }

  return (
    <View style={styles.root}>
      <AmbientGlow />
      <View style={styles.content}>
        <HudHeader />
        <View style={[styles.grid, isWide ? styles.gridRow : styles.gridColumn]}>
          <View style={isWide ? styles.profileColWide : styles.profileColNarrow}>
            <CharacterProfileCard />
          </View>
          <View style={styles.workspaceCol}>
            <RealmViewport activeRealm={activeRealm} onSelectRealm={setActiveRealm} />
            <KineticStage activeRealm={activeRealm} onNextRealm={handleNextRealm} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG_VOID,
  },
  glowLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  glowCircle: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 999,
    shadowColor: DL_COLORS.amethyst,
    shadowOpacity: 0.5,
    shadowRadius: 80,
  },
  glowCircleTopLeft: {
    top: -140,
    left: -140,
  },
  glowCircleBottomRight: {
    bottom: -140,
    right: -80,
    shadowColor: DL_COLORS.lime,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: DL_COLORS.border,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DL_COLORS.amethystGlow,
    backgroundColor: DL_COLORS.amethystSoft,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: DL_COLORS.amethyst,
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  wordmark: {
    fontSize: 17,
    fontWeight: '800',
    color: DL_COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: DL_COLORS.amethyst,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shardsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: DL_COLORS.border,
    backgroundColor: DL_COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: DL_COLORS.amethyst,
    backgroundColor: DL_COLORS.amethystSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonEmoji: {
    fontSize: 17,
  },
  storeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: DL_COLORS.reward,
    backgroundColor: 'rgba(232, 121, 249, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shardsValue: {
    fontSize: 14,
    fontWeight: '800',
    color: DL_COLORS.text,
  },
  shardsLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: DL_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flex: 1,
    gap: 16,
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridColumn: {
    flexDirection: 'column',
  },
  profileColWide: {
    width: 260,
  },
  profileColNarrow: {
    width: '100%',
  },
  workspaceCol: {
    flex: 1,
    gap: 16,
  },
});
