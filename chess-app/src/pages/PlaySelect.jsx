import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { colors, commonStyles, spacing, borderRadius } from '../theme';

const modes = [
  {
    to: '/play/ai',
    icon: '\u2699',
    title: 'vs Computer',
    description: 'Challenge Stockfish AI at various difficulty levels',
    requiresAuth: false,
  },
  {
    to: '/play/local',
    icon: '\u263A',
    title: 'vs Friend (Local)',
    description: 'Play against a friend on the same device',
    requiresAuth: false,
  },
  {
    to: '/play/online',
    icon: '\u26A1',
    title: 'Play Online',
    description: 'Get matched with a player near your rating',
    requiresAuth: true,
  },
];

export default function PlaySelect() {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ ...commonStyles.page, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60 }}>
      <h1 style={{ color: colors.text, marginBottom: spacing.xl, fontSize: 32 }}>Choose Game Mode</h1>
      <div style={{ display: 'flex', gap: spacing.lg, flexWrap: 'wrap', justifyContent: 'center' }}>
        {modes.map((mode) => {
          const disabled = mode.requiresAuth && !isAuthenticated;
          return (
            <Link
              key={mode.to}
              to={disabled ? '/login' : mode.to}
              style={{
                ...commonStyles.card,
                width: 280,
                textDecoration: 'none',
                textAlign: 'center',
                transition: 'transform 0.2s, border-color 0.2s',
                cursor: 'pointer',
                opacity: disabled ? 0.6 : 1,
                display: 'block',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ fontSize: 48, marginBottom: spacing.md }}>{mode.icon}</div>
              <h3 style={{ color: colors.text, fontSize: 20, marginBottom: spacing.sm }}>{mode.title}</h3>
              <p style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 1.5 }}>{mode.description}</p>
              {disabled && (
                <div style={{ marginTop: spacing.sm, fontSize: 12, color: colors.warning }}>Sign in required</div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
