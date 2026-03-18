export const colors = {
  bg: '#312e2b',
  bgCard: '#272522',
  bgDeep: '#1e1e1e',
  bgHover: '#3a3733',
  bgInput: '#1a1917',
  accent: '#81b64c',
  accentHover: '#6fa33e',
  accentLight: 'rgba(129,182,76,0.15)',
  text: '#e8e6e3',
  textSecondary: '#a0a0a0',
  textMuted: '#888',
  textDark: '#555',
  warning: '#f5c518',
  error: '#e74c3c',
  success: '#81b64c',
  info: '#3498db',
  border: '#3a3733',
  borderLight: '#444',
  white: '#fff',
  black: '#000',
  gold: '#ffd700',
  silver: '#c0c0c0',
  bronze: '#cd7f32',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: '50%',
};

export const typography = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  monoFamily: 'ui-monospace, Consolas, monospace',
  h1: { fontSize: 32, fontWeight: 700 },
  h2: { fontSize: 24, fontWeight: 600 },
  h3: { fontSize: 20, fontWeight: 600 },
  h4: { fontSize: 16, fontWeight: 600 },
  body: { fontSize: 15, fontWeight: 400 },
  small: { fontSize: 13, fontWeight: 400 },
  tiny: { fontSize: 11, fontWeight: 400 },
};

export const shadows = {
  sm: '0 2px 4px rgba(0,0,0,0.2)',
  md: '0 4px 12px rgba(0,0,0,0.3)',
  lg: '0 8px 32px rgba(0,0,0,0.4)',
};

export const commonStyles = {
  page: {
    padding: spacing.xl,
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
    transition: 'background-color 0.2s',
  },
  buttonSecondary: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: colors.textSecondary,
    border: `1px solid ${colors.borderLight}`,
    borderRadius: borderRadius.md,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: typography.fontFamily,
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
  },
  link: {
    color: colors.accent,
    textDecoration: 'none',
    cursor: 'pointer',
  },
};
