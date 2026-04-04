// src/theme/index.ts

export const Colors = {
  primary: '#2E7D32',       // Warm Green — primary brand, success states
  success: '#2E7D32',       // Intentionally same as primary; update both if changed
  accent: '#F57C00',        // Soft Orange — warnings, incorrect feedback (not red)
  background: '#FAF9F6',    // Cream — reduces eye strain
  text: '#212121',          // Dark Charcoal — WCAG AA on background
  surface: '#FFFFFF',
  cardBorder: '#E0E0E0',
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
