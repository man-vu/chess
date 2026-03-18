import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../common/Avatar';
import { colors, spacing } from '../../theme';

export default function Navbar() {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav style={{
      backgroundColor: colors.bgDeep,
      borderBottom: `1px solid ${colors.border}`,
      padding: `0 ${spacing.lg}px`,
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
        <Link to="/" style={{ color: colors.text, textDecoration: 'none', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>{'\u265A'}</span> ChessArena
        </Link>
        <div style={{ display: 'flex', gap: spacing.md }}>
          {[
            { to: '/play', label: 'Play' },
            { to: '/leaderboard', label: 'Rankings' },
            { to: '/tournaments', label: 'Tournaments' },
            { to: '/community', label: 'Community' },
            { to: '/news', label: 'News' },
          ].map((link) => (
            <Link key={link.to} to={link.to} style={{ color: colors.textSecondary, textDecoration: 'none', fontSize: 14, fontWeight: 500, padding: '6px 0' }}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
        {isAuthenticated ? (
          <>
            <Link to={`/profile/${currentUser.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: colors.text }}>
              <Avatar username={currentUser.username} size={32} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{currentUser.username}</div>
                <div style={{ fontSize: 11, color: colors.accent }}>{currentUser.elo} ELO</div>
              </div>
            </Link>
            <button onClick={() => { logout(); navigate('/'); }} style={{ background: 'none', border: `1px solid ${colors.borderLight}`, color: colors.textMuted, padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: colors.textSecondary, textDecoration: 'none', fontSize: 14 }}>Sign In</Link>
            <Link to="/signup" style={{ backgroundColor: colors.accent, color: colors.white, textDecoration: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
