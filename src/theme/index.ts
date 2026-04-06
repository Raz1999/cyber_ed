// src/theme/index.ts

export const Colors = {
  primary: '#6A1B9A',       // Royal Purple — brand, buttons, active borders
  secondary: '#00897B',     // Teal — progress, completed states, success
  headerBg: '#3A0066',      // Dark Purple — top bars on all screens
  background: '#F5F0FF',    // Lavender — page background
  surface: '#FFFFFF',
  text: '#3A0066',          // Dark Purple — primary text
  accent: '#F57C00',        // Orange — incorrect feedback (unchanged)
  success: '#00897B',       // Teal — correct answers, completed levels
  points: '#FFB300',        // Gold — points badge
  cardBorder: '#E8E0F0',    // Light purple border
  locked: '#9E9E9E',
  disabled: '#BDBDBD',
};

export const Typography = {
  fontFamily: 'Heebo_400Regular',
  fontFamilyBold: 'Heebo_700Bold',
  bodySize: 18,
  titleSize: 24,
  subtitleSize: 20,
  captionSize: 14,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  card: 20,
  button: 16,
  badge: 12,
  sm: 8,
};

export const TouchTarget = {
  min: 48,   // dp — WCAG / accessibility minimum
};
