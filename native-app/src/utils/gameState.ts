import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { MODULES } from '../../theme';

// The Hero's meta-progression: a single character level/title that sits above
// every module's own 4-stage engine (see src/features/deep-learning). Each
// module still runs its own stages and XP economy; awardXP() is how a module
// feeds its wins into this one persistent, app-wide character sheet.
//
// Written as a vanilla module-level store (not a React Context) so any code
// — including outside a component tree — can call awardXP() directly, while
// components that need to render it live subscribe via useGameState().
//
// Note on the CLAUDE.md guideline: browser `localStorage` doesn't exist on
// iOS/Android (it's web-only), so this uses AsyncStorage, React Native's
// standard on-device persistence, to actually work as a store-ready app.

const STORAGE_KEY = 'mathquest.heroState.v1';
const XP_PER_LEVEL = 100;

interface TitleTier {
  minLevel: number;
  title: string;
}

// Highest matching tier wins — keep sorted ascending by minLevel.
const TITLE_TIERS: TitleTier[] = [
  { minLevel: 1, title: 'Apprentice' },
  { minLevel: 5, title: 'Scholar' },
  { minLevel: 10, title: 'Strategist' },
  { minLevel: 20, title: 'Sage' },
  { minLevel: 35, title: 'Grandmaster' },
];

export interface HeroState {
  totalXp: number;
  level: number;
  title: string;
  /** Module keys (e.g. 'arithmetic') whose full 4-stage progression has been mastered. */
  clearedRealms: string[];
  /** Lifetime totals across every realm/playthrough, for a real accuracy stat (not per-run). */
  totalAttempts: number;
  totalCorrect: number;
  /** The longest correct-answer streak ever hit, in any realm. */
  bestStreakEver: number;
  /** Badge ids earned so far — see BADGES below for id → label/description. */
  badges: string[];
  /** Id into `HERO_CHARACTERS` (theme.ts). Null means the player hasn't picked one yet — the welcome/character-select onboarding gates on this. */
  characterId: string | null;
}

export interface BadgeDef {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

export const BADGES: BadgeDef[] = [
  { id: 'first-blood', emoji: '🗡️', label: 'First Blood', description: 'Defeated your first guardian.' },
  { id: 'perfectionist', emoji: '💎', label: 'Perfectionist', description: 'Cleared a realm without a single wrong answer.' },
  { id: 'streak-master', emoji: '🔥', label: 'Streak Master', description: 'Hit a 5+ answer streak.' },
  { id: 'realm-master', emoji: '👑', label: 'Realm Master', description: `Mastered all ${MODULES.length} realms.` },
];

/** Per-realm-completion stats a module reports once it clears its final stage, folded into the Hero's lifetime totals/badges. */
export interface RunStats {
  attempts: number;
  correct: number;
  bestStreak: number;
}

export interface AwardXpResult {
  didLevelUp: boolean;
  previousLevel: number;
  state: HeroState;
}

function levelForXp(totalXp: number): number {
  return Math.floor(totalXp / XP_PER_LEVEL) + 1;
}

function titleForLevel(level: number): string {
  let title = TITLE_TIERS[0].title;
  for (const tier of TITLE_TIERS) {
    if (level >= tier.minLevel) title = tier.title;
  }
  return title;
}

function buildState(
  totalXp: number,
  clearedRealms: string[] = [],
  totalAttempts = 0,
  totalCorrect = 0,
  bestStreakEver = 0,
  badges: string[] = [],
  characterId: string | null = null
): HeroState {
  const level = levelForXp(totalXp);
  return { totalXp, level, title: titleForLevel(level), clearedRealms, totalAttempts, totalCorrect, bestStreakEver, badges, characterId };
}

/** How far into the current level the Hero is, and how much the level spans — for an XP bar. */
export function xpProgress(state: HeroState): { current: number; span: number } {
  return { current: state.totalXp % XP_PER_LEVEL, span: XP_PER_LEVEL };
}

/** Lifetime accuracy across every realm/playthrough, as a whole-number percentage. */
export function heroAccuracyPct(state: HeroState): number {
  return state.totalAttempts > 0 ? Math.round((state.totalCorrect / state.totalAttempts) * 100) : 100;
}

let state: HeroState = buildState(0);
let hydrated = false;
let hydratePromise: Promise<HeroState> | null = null;
const listeners = new Set<(next: HeroState) => void>();

function notify() {
  listeners.forEach((listener) => listener(state));
}

function persist() {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
    // Persistence is a nicety — a save failure shouldn't break the session's in-memory state.
  });
}

/** Loads any previously-saved Hero state from disk. Safe to call multiple times. */
export function hydrateGameState(): Promise<HeroState> {
  if (hydrated) return Promise.resolve(state);
  if (hydratePromise) return hydratePromise;

  hydratePromise = AsyncStorage.getItem(STORAGE_KEY)
    .then((raw) => {
      if (raw) {
        const saved = JSON.parse(raw) as {
          totalXp: number;
          clearedRealms?: string[];
          totalAttempts?: number;
          totalCorrect?: number;
          bestStreakEver?: number;
          badges?: string[];
          characterId?: string | null;
        };
        state = buildState(
          saved.totalXp ?? 0,
          saved.clearedRealms ?? [],
          saved.totalAttempts ?? 0,
          saved.totalCorrect ?? 0,
          saved.bestStreakEver ?? 0,
          saved.badges ?? [],
          saved.characterId ?? null
        );
      }
      hydrated = true;
      notify();
      return state;
    })
    .catch(() => {
      hydrated = true;
      return state;
    });

  return hydratePromise;
}

export function getGameState(): HeroState {
  return state;
}

export function subscribeGameState(listener: (next: HeroState) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function withBadge(badges: string[], id: string): string[] {
  return badges.includes(id) ? badges : [...badges, id];
}

/** Feeds a module's XP reward into the Hero's overall level. Returns whether it triggered a level-up. */
export function awardXP(amount: number): AwardXpResult {
  const previousLevel = state.level;
  let badges = state.badges;
  if (amount > 0) badges = withBadge(badges, 'first-blood');
  state = buildState(
    state.totalXp + Math.max(0, Math.round(amount)),
    state.clearedRealms,
    state.totalAttempts,
    state.totalCorrect,
    state.bestStreakEver,
    badges,
    state.characterId
  );
  persist();
  notify();
  return { didLevelUp: state.level > previousLevel, previousLevel, state };
}

/** Marks a module's realm as fully mastered (all 4 stages cleared). Idempotent. */
export function markRealmCleared(realmId: string): void {
  if (state.clearedRealms.includes(realmId)) return;
  const clearedRealms = [...state.clearedRealms, realmId];
  let badges = state.badges;
  if (clearedRealms.length >= MODULES.length) badges = withBadge(badges, 'realm-master');
  state = buildState(state.totalXp, clearedRealms, state.totalAttempts, state.totalCorrect, state.bestStreakEver, badges, state.characterId);
  persist();
  notify();
}

/** Folds one realm-completion's stats into the Hero's lifetime totals and awards any badge they unlock. Idempotent per call — call once per realm clear. */
export function recordRunStats({ attempts, correct, bestStreak }: RunStats): void {
  const totalAttempts = state.totalAttempts + attempts;
  const totalCorrect = state.totalCorrect + correct;
  const bestStreakEver = Math.max(state.bestStreakEver, bestStreak);

  let badges = state.badges;
  if (attempts > 0 && correct === attempts) badges = withBadge(badges, 'perfectionist');
  if (bestStreak >= 5) badges = withBadge(badges, 'streak-master');

  state = buildState(state.totalXp, state.clearedRealms, totalAttempts, totalCorrect, bestStreakEver, badges, state.characterId);
  persist();
  notify();
}

/** Sets the player's chosen avatar (see `HERO_CHARACTERS` in theme.ts). Called once from onboarding, or again later if the player wants to switch. */
export function setCharacter(characterId: string): void {
  state = buildState(state.totalXp, state.clearedRealms, state.totalAttempts, state.totalCorrect, state.bestStreakEver, state.badges, characterId);
  persist();
  notify();
}

export function resetGameState(): void {
  state = buildState(0, []);
  persist();
  notify();
}

/** Subscribes a component to the live Hero state, hydrating from disk on first mount. */
export function useGameState(): HeroState {
  const [snapshot, setSnapshot] = useState(state);

  useEffect(() => {
    hydrateGameState().then(setSnapshot);
    return subscribeGameState(setSnapshot);
  }, []);

  return snapshot;
}
