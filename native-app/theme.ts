// Shared "fun, new-generation" design system for the math learning app.
// Individual modules may still use their own functionally-meaningful colors
// (e.g. sin = orange, cos = green, median highlight = blue) where a color
// is part of the taught concept rather than decoration — those stay as-is.

export const theme = {
  color: {
    background: '#FFF8F0',
    surface: '#FFFFFF',
    surfaceMuted: '#FFF1E4',
    border: '#F1E4D3',
    text: '#2B2250',
    textMuted: '#8B85A3',
    textOnDark: '#FFFFFF',

    coral: '#FF5A5F',
    coralDark: '#E44348',
    sky: '#00B8D9',
    skyDark: '#0090AC',
    sunshine: '#FFC93C',
    sunshineDark: '#E8AC12',
    mint: '#2ED9A3',
    mintDark: '#17B586',
    grape: '#8C6BFF',
    grapeDark: '#6E4EE0',
    tangerine: '#FF9F45',
    tangerineDark: '#E8801C',
  },
  font: {
    display: 'Fredoka_700Bold',
    displaySemi: 'Fredoka_600SemiBold',
    body: 'Nunito_400Regular',
    bodySemi: 'Nunito_600SemiBold',
    bodyBold: 'Nunito_700Bold',
    bodyExtraBold: 'Nunito_800ExtraBold',
  },
  radius: {
    sm: 12,
    md: 18,
    lg: 26,
    pill: 999,
  },
  spacing: (multiplier: number) => multiplier * 4,
};

export type ModuleKey = 'arithmetic' | 'compoundInterest' | 'geometry' | 'statistics' | 'trigonometry';

export interface ModuleMeta {
  key: ModuleKey;
  title: string;
  blurb: string;
  emoji: string;
  accent: string;
  accentDark: string;
  /** The guardian this realm's battle arena depicts — flavor text only, no combat math attached. */
  guardianName: string;
  /** Kept distinct per realm on purpose — five different names sharing one emoji would look like the same guardian everywhere. */
  guardianEmoji: string;
  /** Shown in the guardian's detail popup: what it represents and how a player "beats" it. */
  guardianPurpose: string;
}

export const MODULES: ModuleMeta[] = [
  {
    key: 'arithmetic',
    title: 'Number Ninja',
    blurb: 'Slice through +, −, ×, ÷ combos',
    emoji: '🥷',
    accent: theme.color.tangerine,
    accentDark: theme.color.tangerineDark,
    guardianName: 'Digit Golem',
    guardianEmoji: '🧱',
    guardianPurpose: 'A construct built from raw numbers. It represents the arithmetic realm — face it down with fast, accurate +, −, and × instincts.',
  },
  {
    key: 'compoundInterest',
    title: 'Money Grower',
    blurb: 'Watch compound interest snowball your cash',
    emoji: '🌱',
    accent: theme.color.sunshine,
    accentDark: theme.color.sunshineDark,
    guardianName: 'Debt Specter',
    guardianEmoji: '🧾',
    guardianPurpose: 'A haunting reminder of runaway debt. It represents the finance realm — banish it by understanding how compound interest grows money over time.',
  },
  {
    key: 'geometry',
    title: 'Shape Architect',
    blurb: 'Build shapes and unlock area & perimeter',
    emoji: '📐',
    accent: theme.color.grape,
    accentDark: theme.color.grapeDark,
    guardianName: 'Prism Warden',
    guardianEmoji: '🧊',
    guardianPurpose: 'A crystalline guardian of shapes and space. It represents the geometry realm — outsmart it with area, perimeter, and spatial reasoning.',
  },
  {
    key: 'statistics',
    title: 'Data Detective',
    blurb: 'Crack the case of mean, median & mode',
    emoji: '🕵️‍♀️',
    accent: theme.color.mint,
    accentDark: theme.color.mintDark,
    guardianName: 'Noise Phantom',
    guardianEmoji: '📡',
    guardianPurpose: 'A shape-shifter hiding inside scattered data. It represents the statistics realm — see through it with mean, median, and mode.',
  },
  {
    key: 'trigonometry',
    title: 'Circle Spinner',
    blurb: 'Spin the unit circle and chase sin & cos',
    emoji: '🌀',
    accent: theme.color.sky,
    accentDark: theme.color.skyDark,
    guardianName: 'Vortex Maw',
    guardianEmoji: '🕳️',
    guardianPurpose: 'A swirling force born from the unit circle. It represents the trigonometry realm — steady it by mastering sine, cosine, and rotation.',
  },
];

export interface HeroCharacter {
  id: string;
  name: string;
  emoji: string;
  /** The in-world class/role shown as her subtitle, e.g. "Chronomancer". */
  className: string;
  /** One line shown on the character-select card. */
  tagline: string;
  purpose: string;
}

/**
 * The roster of playable avatars, chosen once at the start of a fresh
 * playthrough (see `WelcomeModal`/`CharacterSelectModal`) and persisted on
 * the Hero state (`characterId`). Defined once, here, and looked up
 * everywhere the hero is shown (the home-screen character panel, the
 * in-game battle arena) via `getHeroCharacter` — this is the one source of
 * truth for every playable identity, so no screen can drift out of sync
 * with another.
 *
 * All three are original characters created for this app: no names,
 * designs, or copyrighted likenesses borrowed from any existing show,
 * game, or franchise. Aria Vex is the original hero this app shipped
 * with; Zane Kestrel and Nova Quill are new alternates in the same
 * "time-bending adventurer" world, each with a distinct RPG archetype
 * (mage / blade / inventor) so picking one is a real, visible choice.
 */
export const HERO_CHARACTERS: HeroCharacter[] = [
  {
    id: 'aria',
    name: 'Aria Vex',
    emoji: '🧙‍♀️',
    className: 'Chronomancer',
    tagline: 'A calm, precise time-mage who reads the flow of numbers like a spellbook.',
    purpose:
      'Aria Vex is your avatar — the "Chronomancer" whose level, XP, and title track your overall progress across every realm. Leveling her up is a scoreboard for the whole app; it never changes how any single stage is scored.',
  },
  {
    id: 'zane',
    name: 'Zane Kestrel',
    emoji: '🧝‍♂️',
    className: 'Bladeweaver',
    tagline: 'A swift, confident duelist who cuts straight to the right answer.',
    purpose:
      'Zane Kestrel is your avatar — a "Bladeweaver" who channels total focus into a single decisive strike. His level, XP, and title track your overall progress across every realm exactly like any other hero; picking him only changes how your journey looks, never how a stage is scored.',
  },
  {
    id: 'nova',
    name: 'Nova Quill',
    emoji: '🧑‍🔬',
    className: 'Cogwright',
    tagline: 'A cheerful inventor who out-thinks every problem with clever contraptions.',
    purpose:
      'Nova Quill is your avatar — a "Cogwright" inventor who solves problems with clever contraptions instead of spellcraft. Her level, XP, and title track your overall progress across every realm exactly like any other hero; picking her only changes how your journey looks, never how a stage is scored.',
  },
];

export const DEFAULT_HERO_CHARACTER_ID = HERO_CHARACTERS[0].id;

/** Looks up a hero by id, falling back to the default (Aria) if the id is unset or unrecognized. */
export function getHeroCharacter(id: string | null | undefined): HeroCharacter {
  return HERO_CHARACTERS.find((c) => c.id === id) ?? HERO_CHARACTERS[0];
}
