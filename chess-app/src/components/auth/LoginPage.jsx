import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { colors, commonStyles, spacing, borderRadius } from '../../theme';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    try {
      login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
      <div style={{ ...commonStyles.card, width: 400, maxWidth: '100%' }}>
        <h1 style={{ color: colors.text, fontSize: 28, marginBottom: spacing.lg, textAlign: 'center' }}>Sign In</h1>
        {error && (
          <div style={{ backgroundColor: `${colors.error}22`, color: colors.error, padding: spacing.sm, borderRadius: borderRadius.md, marginBottom: spacing.md, fontSize: 14, textAlign: 'center' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <div>
            <label style={{ color: colors.textSecondary, fontSize: 13, display: 'block', marginBottom: 4 }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={commonStyles.input} placeholder="you@example.com" />
          </div>
          <div>
            <label style={{ color: colors.textSecondary, fontSize: 13, display: 'block', marginBottom: 4 }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={commonStyles.input} placeholder="Enter password" />
          </div>
          <button type="submit" style={{ ...commonStyles.button, width: '100%', marginTop: spacing.sm }}>Sign In</button>
        </form>
        <p style={{ color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg, fontSize: 14 }}>
          Don't have an account? <Link to="/signup" style={commonStyles.link}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
