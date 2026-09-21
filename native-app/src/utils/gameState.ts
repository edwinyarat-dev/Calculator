import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

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

function buildState(totalXp: number): HeroState {
  const level = levelForXp(totalXp);
  return { totalXp, level, title: titleForLevel(level) };
}

/** How far into the current level the Hero is, and how much the level spans — for an XP bar. */
export function xpProgress(state: HeroState): { current: number; span: number } {
  return { current: state.totalXp % XP_PER_LEVEL, span: XP_PER_LEVEL };
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
        const saved = JSON.parse(raw) as { totalXp: number };
        state = buildState(saved.totalXp ?? 0);
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

/** Feeds a module's XP reward into the Hero's overall level. Returns whether it triggered a level-up. */
export function awardXP(amount: number): AwardXpResult {
  const previousLevel = state.level;
  state = buildState(state.totalXp + Math.max(0, Math.round(amount)));
  persist();
  notify();
  return { didLevelUp: state.level > previousLevel, previousLevel, state };
}

export function resetGameState(): void {
  state = buildState(0);
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
