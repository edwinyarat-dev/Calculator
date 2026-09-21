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

export type ModuleKey = 'arithmetic' | 'compoundInterest' | 'geometry' | 'statistics' | 'trigonometry' | 'calculus';

export interface ModuleMeta {
  key: ModuleKey;
  title: string;
  blurb: string;
  emoji: string;
  accent: string;
  accentDark: string;
  /** The guardian this realm's battle arena depicts — flavor text only, no combat math attached. */
  guardianName: string;
  /** Kept distinct per realm on purpose — six different names sharing one emoji would look like the same guardian everywhere. */
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
    guardianEmoji: '🗿',
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
    guardianEmoji: '👻',
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
    guardianEmoji: '💎',
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
    guardianEmoji: '🌫️',
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
    guardianEmoji: '🌪️',
    guardianPurpose: 'A swirling force born from the unit circle. It represents the trigonometry realm — steady it by mastering sine, cosine, and rotation.',
  },
  {
    key: 'calculus',
    title: 'Limit Chaser',
    blurb: 'Squeeze h to zero and catch the tangent',
    emoji: '🚀',
    accent: theme.color.coral,
    accentDark: theme.color.coralDark,
    guardianName: 'Infinity Wraith',
    guardianEmoji: '♾️',
    guardianPurpose: 'A being from the edge of the infinitely small. It represents the calculus realm — tame it by understanding limits and rates of change.',
  },
];

/**
 * The player's single on-screen avatar. Defined once, here, and imported
 * everywhere the hero is shown (the home-screen character panel, the
 * in-game battle arena) — the app previously hardcoded "Aria Vex" and her
 * emoji separately in two different files, which let them drift out of
 * sync (a different emoji gender on each screen). This is now the one
 * source of truth for her identity.
 */
export const HERO_IDENTITY = {
  name: 'Aria Vex',
  emoji: '🧙‍♀️',
  purpose:
    'Aria Vex is your avatar — the "Chronomancer" whose level, XP, and title track your overall progress across every realm. Leveling her up is a scoreboard for the whole app; it never changes how any single stage is scored.',
};
