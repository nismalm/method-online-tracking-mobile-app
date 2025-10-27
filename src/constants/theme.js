// Theme Constants
// All design tokens for the Method Online Tracker app

export const COLORS = {
  // Brand Colors
  brandPrimary: '#e0fe66',
  brandSecondary: '#c2e04f',
  brandDark: '#3c3c3c',
  brandDarkest: '#040404',
  brandWhite: '#ffffff',
  brandBorder: '#e5e5e5',
  brandTextSecondary: '#3c3c3c',
  brandTextLight: '#666666',

  // Standard Colors
  black: '#000000',
  white: '#ffffff',

  // Gray Scale
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',

  // Status Colors
  red500: '#ef4444',
  red600: '#dc2626',
  red700: '#b91c1c',
  green500: '#22c55e',
  green600: '#16a34a',
  blue50: '#dbeafe',
  blue500: '#3b82f6',
  blue600: '#2563eb',
};

export const FONTS = {
  regular: 'Barlow-Regular',
  medium: 'Barlow-Medium',
  semiBold: 'Barlow-SemiBold',
  bold: 'Barlow-Bold',
  extraBold: 'Barlow-ExtraBold',
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
};

// Common styles that can be reused
export const COMMON_STYLES = {
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
};
