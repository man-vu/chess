import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { colors, commonStyles, spacing, borderRadius, shadows, transitions } from '../theme';

const ICONS = {
  ai: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <circle cx="9" cy="9" r="1.5" fill="currentColor" />
      <circle cx="15" cy="9" r="1.5" fill="currentColor" />
      <path d="M9 15h6" />
      <path d="M12 1v3M1 12h3M20 12h3M12 20v3" />
    </svg>
  ),
  local: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3" />
      <circle cx="15" cy="7" r="3" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h2" />
      <path d="M15 15h2a4 4 0 0 1 4 4v2" />
    </svg>
  ),
  online: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  multiplayer: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  editor: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
};

const modes = [
  {
    to: '/play/ai',
    icon: ICONS.ai,
    title: 'vs Computer',
    description: 'Challenge Stockfish AI with real-time evaluation bar',
    requiresAuth: false,
    accent: '#7cb342',
  },
  {
    to: '/play/local',
    icon: ICONS.local,
    title: 'vs Friend',
    description: 'Play against a friend on the same device',
    requiresAuth: false,
    accent: '#60a5fa',
  },
  {
    to: '/play/online',
    icon: ICONS.online,
    title: 'Quick Match',
    description: 'Get matched with a simulated opponent near your rating',
    requiresAuth: true,
    accent: '#fbbf24',
  },
  {
    to: '/play/multiplayer',
    icon: ICONS.multiplayer,
    title: 'Real Multiplayer',
    description: 'Play against a real person via WebSocket server',
    requiresAuth: true,
    accent: '#a78bfa',
  },
  {
    to: '/editor',
    icon: ICONS.editor,
    title: 'Board Editor',
    description: 'Set up custom positions with FEN editor',
    requiresAuth: false,
    accent: '#f472b6',
  },
];

export default function PlaySelect() {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ ...commonStyles.page, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60 }}>
      <h1 style={{
        color: colors.text,
        marginBottom: spacing.sm,
        fontSize: 32,
        fontWeight: 800,
        letterSpacing: '-0.02em',
        animation: 'fadeIn 400ms ease',
      }}>
        Choose Game Mode
      </h1>
      <p style={{
        color: colors.textSecondary,
        marginBottom: spacing.xl,
        fontSize: 16,
        animation: 'fadeIn 400ms ease 100ms both',
      }}>
        Select how you want to play
      </p>
      <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 960 }}>
        {modes.map((mode, i) => {
          const disabled = mode.requiresAuth && !isAuthenticated;
          return (
            <Link
              key={mode.to}
              to={disabled ? '/login' : mode.to}
              style={{
                ...commonStyles.card,
                width: 260,
                textDecoration: 'none',
                textAlign: 'center',
                cursor: 'pointer',
                opacity: disabled ? 0.5 : 1,
                display: 'block',
                position: 'relative',
                overflow: 'hidden',
                animation: `fadeInUp 400ms ease ${i * 80 + 200}ms both`,
              }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.borderColor = mode.accent;
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = `${shadows.lg}, 0 0 24px ${mode.accent}15`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: `linear-gradient(90deg, transparent, ${mode.accent}, transparent)`,
                opacity: 0.6,
              }} />
              <div style={{
                width: 56,
                height: 56,
                borderRadius: borderRadius.lg,
                backgroundColor: `${mode.accent}12`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: `0 auto ${spacing.sm}px`,
                color: mode.accent,
              }}>
                {mode.icon}
              </div>
              <h3 style={{ color: colors.text, fontSize: 18, marginBottom: spacing.xs, fontWeight: 600 }}>{mode.title}</h3>
              <p style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 1.5 }}>{mode.description}</p>
              {disabled && (
                <div style={{
                  marginTop: spacing.sm,
                  fontSize: 12,
                  color: colors.warning,
                  fontWeight: 500,
                  padding: '4px 12px',
                  backgroundColor: `${colors.warning}12`,
                  borderRadius: borderRadius.sm,
                  display: 'inline-block',
                }}>
                  Sign in required
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
