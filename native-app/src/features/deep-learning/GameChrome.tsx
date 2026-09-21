import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { awardXP, markRealmCleared, recordRunStats, useGameState } from '../../utils/gameState';
import { getHeroCharacter, MODULES } from '../../../theme';
import { BattlePulseProvider } from './BattlePulseContext';
import { BattleStage } from './BattleStage';
import { DeepLearningProvider, useDeepLearning } from './DeepLearningContext';
import LevelSelector from './LevelSelector';
import { DL_COLORS } from './theme';
import type { MathStageConfig } from './types';

const MAX_HP = 100;
const MAX_MP = 100;

// Shared chrome around every 4-stage math module: the XP bar + streak badge,
// the encouragement-shield near-miss banner, and the stage-cleared banner.
// Pulled out of the first module (Trigonometry) once it became clear every
// subsequent module (Arithmetic, Geometry, …) would need the exact same
// shell around its own stage components.

function VitalBar({
  label,
  value,
  max,
  colorFrom,
  colorTo,
  trackColor,
}: {
  label: string;
  value: number;
  max: number;
  colorFrom: string;
  colorTo: string;
  trackColor: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const gradientId = `vitalGradient-${label}`;
  return (
    <View style={styles.vitalRow}>
      <Text style={styles.vitalLabel}>{label}</Text>
      <View style={[styles.vitalTrack, { backgroundColor: trackColor }]}>
        <View style={[styles.vitalFillWrap, { width: `${pct}%` }]}>
          <Svg width={220} height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0%" stopColor={colorFrom} />
                <Stop offset="100%" stopColor={colorTo} />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${gradientId})`} />
          </Svg>
        </View>
      </View>
      <Text style={styles.vitalValue}>
        {Math.round(value)}/{max}
      </Text>
    </View>
  );
}

/** The Top HUD Profile Bay: character identity plus HP (neon green), MP (blue), and this
 * playthrough's XP (purple) — a cosmetic layer mirroring v0's own self-healing HP/MP
 * mechanic exactly (a miss docks HP with a random hit and auto-revives at 0; a win tops
 * up MP, capped) so it never touches the real stage scoring or win conditions underneath. */
function HeroVitalsBay({ hp, mp, xpEarned, maxXp, streakCount }: { hp: number; mp: number; xpEarned: number; maxXp: number; streakCount: number }) {
  const hero = useGameState();
  const heroCharacter = getHeroCharacter(hero.characterId);
  const isHot = streakCount >= 3;

  return (
    <View style={styles.hudBay}>
      <View style={styles.hudIdentityRow}>
        <Text style={styles.hudIdentity}>
          Lv {hero.level} {hero.title} · {heroCharacter.name}
        </Text>
        {streakCount > 0 && (
          <View style={[styles.streakBadge, isHot && styles.streakBadgeHot]}>
            <Text style={styles.streakText}>{isHot ? '🔥' : '✦'} {streakCount}x streak</Text>
          </View>
        )}
      </View>
      <VitalBar label="HP" value={hp} max={MAX_HP} colorFrom="#34D399" colorTo={DL_COLORS.lime} trackColor="rgba(52, 211, 153, 0.14)" />
      <VitalBar label="MP" value={mp} max={MAX_MP} colorFrom={DL_COLORS.sky} colorTo="#6366F1" trackColor={DL_COLORS.skySoft} />
      <VitalBar label="XP" value={xpEarned} max={maxXp} colorFrom={DL_COLORS.amethyst} colorTo="#E879F9" trackColor={DL_COLORS.amethystSoft} />
    </View>
  );
}

/** The Bottom Magic Deck: a consistent spellcaster-console section around whichever
 * interactive widget the active stage renders (sliders, taps, holds, keypad) — the
 * widget itself is untouched, this only wraps it in the shared visual chrome. Sits
 * inside the same outer frame as the Battle Arena above it (see `combatFrame`), with
 * just a divider between them, so the two read as one screen instead of two boxes. */
function MagicDeckFrame({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.deckFrame}>
      <View style={styles.deckHeader}>
        <View style={styles.deckHeaderDot} />
        <Text style={styles.deckHeaderText}>Magic Deck</Text>
      </View>
      {children}
    </View>
  );
}

export function NearMissBanner() {
  const { isNearMiss, nearMissMessage } = useDeepLearning();
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isNearMiss) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 500, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 500, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isNearMiss, glow]);

  if (!isNearMiss || !nearMissMessage) return null;

  const borderColor = glow.interpolate({ inputRange: [0, 1], outputRange: [DL_COLORS.amethystSoft, DL_COLORS.amethyst] });

  return (
    <Animated.View style={[styles.nearMissBanner, { borderColor }]}>
      <Text style={styles.nearMissText}>💡 {nearMissMessage}</Text>
    </Animated.View>
  );
}

export function StageCompleteBanner({
  visible,
  onContinue,
}: {
  visible: boolean;
  /** Advances to the next stage. */
  onContinue: () => void;
}) {
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slide, { toValue: visible ? 1 : 0, useNativeDriver: true, friction: 7 }).start();
  }, [visible, slide]);

  if (!visible) return null;

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });

  return (
    <Animated.View style={[styles.completeBanner, { opacity: slide, transform: [{ translateY }] }]}>
      <Text style={styles.completeEmoji}>⚡</Text>
      <Text style={styles.completeTitle}>Stage Cleared!</Text>
      <Pressable
        style={styles.continueButton}
        onPress={onContinue}
        accessibilityRole="button"
        accessibilityLabel="Continue to next stage"
      >
        <Text style={styles.continueButtonText}>Continue ➔</Text>
      </Pressable>
    </Animated.View>
  );
}

/** A single labeled number in the realm-complete summary grid. */
function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryStat}>
      <Text style={styles.summaryStatValue}>{value}</Text>
      <Text style={styles.summaryStatLabel}>{label}</Text>
    </View>
  );
}

/**
 * Pops up over the whole screen once a player clears every stage of a realm — a real
 * educational debrief (guardian defeated, XP, accuracy, streak, skills practiced,
 * mistakes/near-misses), not just a "Victory" banner. Distinct from the inline
 * per-stage banner since finishing a realm is a bigger moment worth interrupting the
 * view for. The world map stays visible behind/around this screen (`RealmViewport` is
 * an always-present rail, not a separate destination), so "Play Again" already leaves
 * the player free to pick a different realm next.
 */
export function RealmCompleteModal({
  visible,
  realmTitle,
  realmEmoji,
  guardianName,
  xpEarned,
  totalAttempts,
  totalCorrect,
  totalNearMisses,
  bestStreakEver,
  skillsPracticed,
  onPlayAgain,
}: {
  visible: boolean;
  realmTitle: string;
  realmEmoji: string;
  guardianName: string;
  xpEarned: number;
  totalAttempts: number;
  totalCorrect: number;
  totalNearMisses: number;
  bestStreakEver: number;
  skillsPracticed: string[];
  onPlayAgain: () => void;
}) {
  const mistakes = Math.max(0, totalAttempts - totalCorrect - totalNearMisses);
  const accuracyPct = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 100;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onPlayAgain}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalEmoji}>{realmEmoji} 🏆</Text>
          <Text style={styles.modalTitle}>Realm Complete!</Text>
          <Text style={styles.modalSubtitle}>
            You defeated the {guardianName} and mastered every stage of {realmTitle}.
          </Text>

          <View style={styles.summaryGrid}>
            <SummaryStat label="XP Earned" value={`+${xpEarned}`} />
            <SummaryStat label="Accuracy" value={`${accuracyPct}%`} />
            <SummaryStat label="Best Streak" value={`${bestStreakEver}x`} />
            <SummaryStat label="Near Misses" value={`${totalNearMisses}`} />
          </View>

          {mistakes > 0 && (
            <Text style={styles.summaryMistakes}>
              {mistakes} question{mistakes === 1 ? '' : 's'} missed along the way — that's how the magic sticks.
            </Text>
          )}

          {skillsPracticed.length > 0 && (
            <View style={styles.skillsWrap}>
              <Text style={styles.skillsLabel}>Skills practiced</Text>
              <View style={styles.skillsPillRow}>
                {skillsPracticed.map((skill) => (
                  <View key={skill} style={styles.skillPill}>
                    <Text style={styles.skillPillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Pressable
            style={styles.continueButton}
            onPress={onPlayAgain}
            accessibilityRole="button"
            accessibilityLabel="Play again with a fresh set of questions"
          >
            <Text style={styles.continueButtonText}>Play Again ↻</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function GameInner({ maxXp, realmId, onRestart }: { maxXp: number; realmId?: string; onRestart: () => void }) {
  const {
    stages,
    activeStageIndex,
    activeStage,
    unlockedStages,
    submitInput,
    goToStage,
    lastResult,
    resultToken,
    isNearMiss,
    streakCount,
    xpEarned,
    wasCrit,
    totalAttempts,
    totalCorrect,
    totalNearMisses,
    bestStreakEver,
    skillsPracticed,
  } = useDeepLearning();
  const [showBanner, setShowBanner] = useState(false);
  const [lastXpGain, setLastXpGain] = useState(0);
  const [hp, setHp] = useState(MAX_HP);
  const [mp, setMp] = useState(40);
  const [pulseToken, setPulseToken] = useState(0);
  const prevXpRef = useRef(0);
  const isFirstResult = useRef(true);
  const pulse = React.useCallback(() => setPulseToken((t) => t + 1), []);

  const isFinalStage = activeStageIndex === stages.length - 1;
  const realmMeta = MODULES.find((m) => m.key === realmId);

  // Mirror this module's own XP economy into the app-wide Hero character —
  // each module keeps running its local engine unchanged; this just feeds the
  // delta since last mirror into the global level/title system. Keyed off
  // `xpEarned` itself (not `lastResult === 'won'`) so a near-miss's one-time
  // partial-credit XP reaches the Hero store too, not just full clears.
  useEffect(() => {
    const delta = xpEarned - prevXpRef.current;
    if (delta > 0) {
      awardXP(delta);
      if (lastResult === 'won') setLastXpGain(delta);
      prevXpRef.current = xpEarned;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xpEarned]);

  useEffect(() => {
    if (lastResult !== 'won') return;
    setShowBanner(true);
    if (isFinalStage) {
      if (realmId) markRealmCleared(realmId);
      recordRunStats({ attempts: totalAttempts, correct: totalCorrect, bestStreak: bestStreakEver });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastResult, activeStageIndex]);

  // Top HUD's HP/MP: a cosmetic layer that mirrors v0's own mechanic exactly —
  // a miss docks HP with a random hit (skipped for an encouraging near-miss),
  // a win tops up MP, both capped/floored and self-healing. This never reads
  // from or writes to the real stage scoring above.
  useEffect(() => {
    if (isFirstResult.current) {
      isFirstResult.current = false;
      return;
    }
    if (lastResult === 'won') {
      setMp((m) => Math.min(MAX_MP, m + 18));
    } else if (lastResult === 'lost' && !isNearMiss) {
      const dmg = 12 + Math.floor(Math.random() * 10);
      setHp((h) => Math.max(0, h - dmg));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultToken]);

  useEffect(() => {
    if (hp > 0) return;
    const timer = setTimeout(() => setHp(MAX_HP), 700);
    return () => clearTimeout(timer);
  }, [hp]);

  function handleContinue() {
    setShowBanner(false);
    if (!isFinalStage) {
      goToStage(activeStageIndex + 1);
    } else {
      onRestart();
    }
  }

  const StageCanvas = activeStage.renderCanvas;

  return (
    <View style={styles.gameContainer}>
      <HeroVitalsBay hp={hp} mp={mp} xpEarned={xpEarned} maxXp={maxXp} streakCount={streakCount} />
      <LevelSelector stages={stages} activeStageIndex={activeStageIndex} unlockedStages={unlockedStages} onSelectStage={goToStage} />
      <BattlePulseProvider value={pulse}>
        <View style={styles.combatFrame}>
          <BattleStage
            realmTitle={realmMeta?.title ?? 'Realm'}
            realmEmoji={realmMeta?.emoji ?? '🧙'}
            guardianName={realmMeta?.guardianName ?? 'Guardian'}
            guardianEmoji={realmMeta?.guardianEmoji ?? '👹'}
            guardianPurpose={realmMeta?.guardianPurpose ?? 'A guardian of this realm.'}
            stageIndex={activeStageIndex}
            totalStages={stages.length}
            lastResult={lastResult}
            resultToken={resultToken}
            isNearMiss={isNearMiss}
            xpGain={lastXpGain}
            wasCrit={wasCrit}
            channelPulse={pulseToken}
          />
          <Text style={styles.stageTitle}>{activeStage.title}</Text>
          <NearMissBanner />
          {!showBanner && (
            <MagicDeckFrame>
              <StageCanvas
                value={0}
                onChangeValue={() => {}}
                onCommit={submitInput}
                target={activeStage.targetValue}
                tolerance={activeStage.toleranceThreshold}
                isNearMiss={false}
                nearMissMessage={null}
                isActive
              />
            </MagicDeckFrame>
          )}
        </View>
      </BattlePulseProvider>
      <StageCompleteBanner visible={showBanner && !isFinalStage} onContinue={handleContinue} />
      <RealmCompleteModal
        visible={showBanner && isFinalStage}
        realmTitle={realmMeta?.title ?? 'this realm'}
        realmEmoji={realmMeta?.emoji ?? '🏆'}
        guardianName={realmMeta?.guardianName ?? 'the guardian'}
        xpEarned={xpEarned}
        totalAttempts={totalAttempts}
        totalCorrect={totalCorrect}
        totalNearMisses={totalNearMisses}
        bestStreakEver={bestStreakEver}
        skillsPracticed={skillsPracticed}
        onPlayAgain={handleContinue}
      />
    </View>
  );
}

/** Drop-in 4-stage game screen: hand it a module's stage configs and it wires up the whole shell. */
export function DeepLearningGameScreen({
  stages,
  maxXp,
  realmId,
  onRestart,
}: {
  stages: MathStageConfig[];
  maxXp: number;
  /** Module key (e.g. 'arithmetic') used to mark this realm cleared in the global Hero state on mastery. */
  realmId?: string;
  /** Called when the player taps "Play Again" after mastering the final stage — the caller should regenerate fresh random content and remount this tree (e.g. via a changing `key`). */
  onRestart?: () => void;
}) {
  return (
    <DeepLearningProvider stages={stages}>
      <View style={styles.root}>
        <GameInner maxXp={maxXp} realmId={realmId} onRestart={onRestart ?? (() => {})} />
      </View>
    </DeepLearningProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: DL_COLORS.bgDeep,
  },
  gameContainer: {
    padding: 14,
    paddingBottom: 32,
  },
  hudBay: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: DL_COLORS.border,
    backgroundColor: DL_COLORS.surface,
    padding: 12,
    marginBottom: 10,
    gap: 6,
  },
  hudIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  hudIdentity: {
    fontSize: 12.5,
    fontWeight: '800',
    color: DL_COLORS.text,
  },
  vitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vitalLabel: {
    width: 26,
    fontSize: 10.5,
    fontWeight: '800',
    color: DL_COLORS.textMuted,
    textTransform: 'uppercase',
  },
  vitalTrack: {
    flex: 1,
    height: 9,
    borderRadius: 999,
    overflow: 'hidden',
  },
  vitalFillWrap: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  vitalValue: {
    width: 54,
    fontSize: 10.5,
    fontWeight: '800',
    color: DL_COLORS.text,
    textAlign: 'right',
  },
  combatFrame: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: DL_COLORS.border,
    backgroundColor: DL_COLORS.surface,
    marginBottom: 10,
    overflow: 'hidden',
  },
  deckFrame: {
    borderTopWidth: 2,
    borderTopColor: DL_COLORS.sky,
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    padding: 14,
    paddingTop: 16,
  },
  deckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  deckHeaderDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: DL_COLORS.sky,
    shadowColor: DL_COLORS.sky,
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  deckHeaderText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: DL_COLORS.sky,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  streakBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: DL_COLORS.surfaceMuted,
  },
  streakBadgeHot: {
    backgroundColor: DL_COLORS.limeSoft,
    shadowColor: DL_COLORS.lime,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '800',
    color: DL_COLORS.lime,
  },
  stageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DL_COLORS.text,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 14,
  },
  nearMissBanner: {
    borderWidth: 2,
    borderRadius: 14,
    padding: 10,
    marginHorizontal: 14,
    marginBottom: 10,
    backgroundColor: DL_COLORS.surface,
  },
  nearMissText: {
    color: DL_COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  completeBanner: {
    backgroundColor: DL_COLORS.limeSoft,
    borderWidth: 2,
    borderColor: DL_COLORS.lime,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    shadowColor: DL_COLORS.lime,
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  completeEmoji: {
    fontSize: 44,
  },
  completeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: DL_COLORS.lime,
  },
  continueButton: {
    backgroundColor: DL_COLORS.lime,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 10,
    marginTop: 4,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: DL_COLORS.bgDeep,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 9, 18, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: DL_COLORS.limeSoft,
    borderWidth: 2,
    borderColor: DL_COLORS.lime,
    borderRadius: 26,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    shadowColor: DL_COLORS.lime,
    shadowOpacity: 0.7,
    shadowRadius: 24,
    elevation: 14,
  },
  modalEmoji: {
    fontSize: 48,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: DL_COLORS.lime,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: DL_COLORS.text,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  summaryStat: {
    minWidth: 76,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: DL_COLORS.lime,
    backgroundColor: 'rgba(11, 15, 25, 0.35)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  summaryStatValue: {
    fontSize: 17,
    fontWeight: '800',
    color: DL_COLORS.lime,
  },
  summaryStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: DL_COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: 'center',
  },
  summaryMistakes: {
    fontSize: 12.5,
    fontWeight: '600',
    color: DL_COLORS.text,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  skillsWrap: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  skillsLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: DL_COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  skillsPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  skillPill: {
    borderWidth: 1,
    borderColor: DL_COLORS.amethyst,
    backgroundColor: DL_COLORS.amethystSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  skillPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: DL_COLORS.amethyst,
  },
});
