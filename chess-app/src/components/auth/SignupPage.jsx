import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { colors, commonStyles, spacing, borderRadius, shadows } from '../../theme';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 4) { setError('Password must be at least 4 characters'); return; }
    if (username.length < 3) { setError('Username must be at least 3 characters'); return; }
    try {
      signup(email, password, username);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
      <div style={{
        ...commonStyles.card,
        width: 420,
        maxWidth: '100%',
        boxShadow: shadows.lg,
        animation: 'fadeInScale 400ms ease',
      }}>
        <div style={{ textAlign: 'center', marginBottom: spacing.lg }}>
          <div style={{
            fontSize: 36,
            marginBottom: spacing.sm,
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
          }}>{'\u265A'}</div>
          <h1 style={{ color: colors.text, fontSize: 24, margin: 0, fontWeight: 700 }}>Create Account</h1>
          <p style={{ color: colors.textSecondary, fontSize: 14, marginTop: 6 }}>Join the chess community</p>
        </div>
        {error && (
          <div style={{
            backgroundColor: `${colors.error}12`,
            color: colors.error,
            padding: `${spacing.sm}px ${spacing.md}px`,
            borderRadius: borderRadius.md,
            marginBottom: spacing.md,
            fontSize: 14,
            textAlign: 'center',
            border: `1px solid ${colors.error}30`,
          }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <div>
            <label style={{ color: colors.textSecondary, fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={commonStyles.input}
              placeholder="ChessMaster42"
              onFocus={(e) => { e.target.style.borderColor = colors.borderFocus; e.target.style.boxShadow = `0 0 0 3px ${colors.accentLight}`; }}
              onBlur={(e) => { e.target.style.borderColor = colors.borderLight; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div>
            <label style={{ color: colors.textSecondary, fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={commonStyles.input}
              placeholder="you@example.com"
              onFocus={(e) => { e.target.style.borderColor = colors.borderFocus; e.target.style.boxShadow = `0 0 0 3px ${colors.accentLight}`; }}
              onBlur={(e) => { e.target.style.borderColor = colors.borderLight; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div>
            <label style={{ color: colors.textSecondary, fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={commonStyles.input}
              placeholder="Min 4 characters"
              onFocus={(e) => { e.target.style.borderColor = colors.borderFocus; e.target.style.boxShadow = `0 0 0 3px ${colors.accentLight}`; }}
              onBlur={(e) => { e.target.style.borderColor = colors.borderLight; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <button type="submit" style={{
            ...commonStyles.button,
            width: '100%',
            marginTop: spacing.sm,
            padding: '14px 24px',
            fontSize: 16,
            background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})`,
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = shadows.md; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            Create Account
          </button>
        </form>
        <p style={{ color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg, fontSize: 14 }}>
          Already have an account? <Link to="/login" style={commonStyles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
