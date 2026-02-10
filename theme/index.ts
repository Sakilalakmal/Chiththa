import type { TextStyle } from 'react-native';

export const colors = {
  black: '#111111',
  white: '#FFFFFF',
  neutral100: '#F7F7F7',
  neutral200: '#ECECEC',
  neutral300: '#DEDEDE',
  neutral400: '#C8C8C8',
  neutral500: '#8B8B8B',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  textPrimary: '#111111',
  textSecondary: '#4B4B4B',
  border: '#DEDEDE',
  divider: '#ECECEC',
  success: '#3DA36E',
  accent: '#4B79C9',
  accentSoft: '#EAF0FA',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 12,
  md: 14,
  lg: 16,
  pill: 999,
} as const;

export const borders = {
  thin: 1,
} as const;

export const typography = {
  families: {
    regular: 'Manrope_400Regular',
    medium: 'Manrope_500Medium',
    semibold: 'Manrope_600SemiBold',
  },
  sizes: {
    title: 30,
    subtitle: 22,
    body: 17,
    caption: 14,
    button: 16,
  },
  lineHeights: {
    title: 38,
    subtitle: 30,
    body: 26,
    caption: 20,
    button: 22,
  },
} as const;

export type TextVariant = 'title' | 'subtitle' | 'body' | 'caption';

export const textVariants: Record<TextVariant, TextStyle> = {
  title: {
    fontFamily: typography.families.semibold,
    fontSize: typography.sizes.title,
    lineHeight: typography.lineHeights.title,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: typography.families.medium,
    fontSize: typography.sizes.subtitle,
    lineHeight: typography.lineHeights.subtitle,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: typography.families.regular,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
    color: colors.textPrimary,
  },
  caption: {
    fontFamily: typography.families.regular,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
    color: colors.textSecondary,
  },
};

export const motion = {
  pressScale: 0.97,
  pressOpacity: 0.9,
  durationFast: 120,
  durationNormal: 180,
} as const;

export const layout = {
  screenHorizontalPadding: spacing.lg,
  screenTopPadding: spacing.lg,
  screenBottomPadding: spacing.md,
  buttonMinHeight: 52,
  inputMinHeight: 52,
  cardMinHeight: 72,
  tabBarHeight: 72,
  tabIconSize: 20,
  successTickSize: 28,
} as const;

export const appTheme = {
  colors,
  spacing,
  radius,
  borders,
  typography,
  motion,
  layout,
  textVariants,
} as const;
