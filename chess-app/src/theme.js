// Static theme tokens - these are the dark theme defaults.
// Components that need dynamic theming should use useTheme() from ThemeContext.
// These static exports are kept for backwards compatibility with all existing components.

import { darkTheme } from './themes';

export const colors = darkTheme.colors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: '50%',
};

export const typography = {
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  monoFamily: '"JetBrains Mono", ui-monospace, "Cascadia Code", Consolas, monospace',
  h1: { fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 },
  h2: { fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3 },
  h3: { fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.35 },
  h4: { fontSize: 16, fontWeight: 600, lineHeight: 1.4 },
  body: { fontSize: 15, fontWeight: 400, lineHeight: 1.6 },
  small: { fontSize: 13, fontWeight: 400, lineHeight: 1.5 },
  tiny: { fontSize: 11, fontWeight: 500, lineHeight: 1.4, letterSpacing: '0.02em' },
  label: { fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' },
};

export const shadows = darkTheme.shadows;

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  spring: '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
};

export const commonStyles = {
  page: {
    paddingTop: spacing.xl,
    paddingRight: spacing.xl,
    paddingBottom: spacing.xl,
    paddingLeft: spacing.xl,
    maxWidth: 1200,
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    border: `1px solid ${colors.border}`,
    transition: `border-color ${transitions.base}, box-shadow ${transitions.base}`,
  },
  cardHoverable: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    border: `1px solid ${colors.border}`,
    transition: `border-color ${transitions.base}, box-shadow ${transitions.base}, transform ${transitions.base}`,
    cursor: 'pointer',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: colors.accent,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: typography.fontFamily,
    transition: `background-color ${transitions.fast}, transform ${transitions.fast}, box-shadow ${transitions.fast}`,
    outline: 'none',
  },
  buttonSecondary: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: colors.textSecondary,
    border: `1px solid ${colors.borderLight}`,
    borderRadius: borderRadius.md,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: typography.fontFamily,
    transition: `color ${transitions.fast}, border-color ${transitions.fast}, background-color ${transitions.fast}`,
    outline: 'none',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: colors.bgInput,
    color: colors.text,
    border: `1px solid ${colors.borderLight}`,
    borderRadius: borderRadius.md,
    fontSize: 15,
    fontFamily: typography.fontFamily,
    boxSizing: 'border-box',
    outline: 'none',
    transition: `border-color ${transitions.fast}, box-shadow ${transitions.fast}`,
  },
  link: {
    color: colors.accent,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: `color ${transitions.fast}`,
  },
};
