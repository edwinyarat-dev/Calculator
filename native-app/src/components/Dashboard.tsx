import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { DL_COLORS } from '../features/deep-learning/theme';
import { useGameState, xpProgress } from '../utils/gameState';

// Reuses the app's existing "Electric Amethyst & Cyber Lime" identity (see
// src/features/deep-learning/theme.ts) rather than inventing a third
// palette — the RPG shell and the module games should read as one world.

const SIDEBAR_BREAKPOINT = 700;

function CharacterProfileFrame() {
  const hero = useGameState();
  const { current, span } = xpProgress(hero);
  const pct = Math.min(100, (current / span) * 100);

  return (
    <View style={styles.profileFrame}>
      <View style={styles.avatarRing}>
        <Text style={styles.avatarEmoji}>🧙</Text>
      </View>
      <Text style={styles.heroTitle}>{hero.title}</Text>
      <Text style={styles.heroLevel}>Level {hero.level}</Text>

      <View style={styles.xpBarTrack}>
        <View style={[styles.xpBarFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.xpBarLabel}>{current} / {span} XP to Level {hero.level + 1}</Text>

      <View style={styles.totalXpPill}>
        <Text style={styles.totalXpText}>{hero.totalXp} total XP</Text>
      </View>
    </View>
  );
}

export interface DashboardProps {
  /** The dynamic world map / active math game rendered in the large viewport. */
  children?: React.ReactNode;
}

export default function Dashboard({ children }: DashboardProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= SIDEBAR_BREAKPOINT;

  return (
    <View style={[styles.root, isWide ? styles.rootRow : styles.rootColumn]}>
      <View style={[styles.sidebar, isWide ? styles.sidebarWide : styles.sidebarNarrow]}>
        <CharacterProfileFrame />
      </View>
      <View style={styles.viewport}>
        {children ?? (
          <View style={styles.viewportEmpty}>
            <Text style={styles.viewportEmptyText}>The world map goes here.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DL_COLORS.bgDeep,
    gap: 14,
    padding: 14,
  },
  rootRow: {
    flexDirection: 'row',
  },
  rootColumn: {
    flexDirection: 'column',
  },
  sidebar: {
    backgroundColor: DL_COLORS.surface,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: DL_COLORS.border,
    padding: 18,
  },
  sidebarWide: {
    width: 220,
  },
  sidebarNarrow: {
    width: '100%',
  },
  profileFrame: {
    alignItems: 'center',
    gap: 6,
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
    marginBottom: 4,
  },
  avatarEmoji: {
    fontSize: 34,
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: DL_COLORS.amethyst,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  heroLevel: {
    fontSize: 20,
    fontWeight: '800',
    color: DL_COLORS.text,
    marginBottom: 8,
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
  totalXpPill: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: DL_COLORS.surfaceMuted,
  },
  totalXpText: {
    fontSize: 11,
    fontWeight: '700',
    color: DL_COLORS.lime,
  },
  viewport: {
    flex: 1,
    backgroundColor: DL_COLORS.surface,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: DL_COLORS.border,
    overflow: 'hidden',
    minHeight: 320,
  },
  viewportEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewportEmptyText: {
    fontSize: 13,
    color: DL_COLORS.textMuted,
  },
});
