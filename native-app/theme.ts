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

export type ModuleKey = 'statistics' | 'trigonometry' | 'calculus';

export interface ModuleMeta {
  key: ModuleKey;
  title: string;
  blurb: string;
  emoji: string;
  accent: string;
  accentDark: string;
}

export const MODULES: ModuleMeta[] = [
  {
    key: 'statistics',
    title: 'Data Detective',
    blurb: 'Crack the case of mean, median & mode',
    emoji: '🕵️‍♀️',
    accent: theme.color.mint,
    accentDark: theme.color.mintDark,
  },
  {
    key: 'trigonometry',
    title: 'Circle Spinner',
    blurb: 'Spin the unit circle and chase sin & cos',
    emoji: '🌀',
    accent: theme.color.sky,
    accentDark: theme.color.skyDark,
  },
  {
    key: 'calculus',
    title: 'Limit Chaser',
    blurb: 'Squeeze h to zero and catch the tangent',
    emoji: '🚀',
    accent: theme.color.coral,
    accentDark: theme.color.coralDark,
  },
];
