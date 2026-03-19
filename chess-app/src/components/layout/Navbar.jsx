import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../common/Avatar';
import ThemeToggle from '../ThemeToggle';
import { colors, spacing, shadows, transitions } from '../../theme';

const NAV_LINKS = [
  { to: '/play', label: 'Play' },
  { to: '/leaderboard', label: 'Rankings' },
  { to: '/tournaments', label: 'Tournaments' },
  { to: '/community', label: 'Community' },
  { to: '/puzzles', label: 'Puzzles' },
  { to: '/news', label: 'News' },
];

export default function Navbar() {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav style={{
      backgroundColor: colors.bgDeep,
      borderBottom: `1px solid ${colors.border}`,
      padding: `0 ${spacing.xl}px`,
      height: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xl }}>
        <Link to="/" style={{
          color: colors.text,
          textDecoration: 'none',
          fontSize: 20,
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          letterSpacing: '-0.02em',
          transition: `opacity ${transitions.fast}`,
        }}>
          <span style={{
            fontSize: 22,
            width: 36,
            height: 36,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: shadows.sm,
          }}>{'\u265A'}</span>
          <span className="nav-logo-text">ChessArena</span>
        </Link>
        <div className="nav-links" style={{ display: 'flex', gap: 4 }}>
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.to || location.pathname.startsWith(link.to + '/');
            return (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  color: isActive ? colors.text : colors.textSecondary,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                  padding: '8px 14px',
                  borderRadius: 8,
                  backgroundColor: isActive ? colors.bgHover : 'transparent',
                  transition: `color ${transitions.fast}, background-color ${transitions.fast}`,
                  position: 'relative',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = colors.text;
                    e.currentTarget.style.backgroundColor = colors.bgHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = colors.textSecondary;
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {link.label}
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    bottom: -2,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 20,
                    height: 2,
                    backgroundColor: colors.accent,
                    borderRadius: 1,
                  }} />
                )}
              </Link>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        <ThemeToggle />
        {isAuthenticated ? (
          <>
            <Link to={`/profile/${currentUser.id}`} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
              color: colors.text,
              padding: '6px 12px',
              borderRadius: 10,
              transition: `background-color ${transitions.fast}`,
            }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.bgHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Avatar username={currentUser.username} size={32} />
              <div className="nav-user-info">
                <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>{currentUser.username}</div>
                <div style={{ fontSize: 11, color: colors.accent, fontWeight: 600 }}>{currentUser.elo} ELO</div>
              </div>
            </Link>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="nav-logout-btn"
              style={{
                background: 'none',
                border: `1px solid ${colors.borderLight}`,
                color: colors.textMuted,
                padding: '6px 14px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                transition: `color ${transitions.fast}, border-color ${transitions.fast}`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = colors.text; e.currentTarget.style.borderColor = colors.text; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = colors.textMuted; e.currentTarget.style.borderColor = colors.borderLight; }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{
              color: colors.textSecondary,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
              padding: '8px 16px',
              borderRadius: 8,
              transition: `color ${transitions.fast}, background-color ${transitions.fast}`,
            }}
              onMouseEnter={(e) => { e.currentTarget.style.color = colors.text; e.currentTarget.style.backgroundColor = colors.bgHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = colors.textSecondary; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              Sign In
            </Link>
            <Link to="/signup" style={{
              background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})`,
              color: colors.white,
              textDecoration: 'none',
              padding: '8px 20px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              boxShadow: shadows.sm,
              transition: `transform ${transitions.fast}, box-shadow ${transitions.fast}`,
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = shadows.md; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = shadows.sm; }}
            >
              Sign Up
            </Link>
          </>
        )}
      </div>

      {/* Mobile hamburger button — visible only when nav-links is hidden */}
      <button
        className="nav-hamburger"
        onClick={() => setMobileMenuOpen((o) => !o)}
        aria-label="Menu"
        style={{
          display: 'none', // shown via CSS media query
          background: 'none',
          border: `1px solid ${colors.borderLight}`,
          color: colors.text,
          borderRadius: 6,
          padding: '6px 8px',
          cursor: 'pointer',
          fontSize: 18,
          lineHeight: 1,
        }}
      >
        {mobileMenuOpen ? '✕' : '☰'}
      </button>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div
          className="nav-mobile-menu"
          style={{
            position: 'absolute',
            top: 60,
            left: 0,
            right: 0,
            backgroundColor: colors.bgDeep,
            borderBottom: `1px solid ${colors.border}`,
            padding: spacing.md,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            zIndex: 100,
            boxShadow: shadows.lg,
          }}
        >
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.to || location.pathname.startsWith(link.to + '/');
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  color: isActive ? colors.accent : colors.text,
                  textDecoration: 'none',
                  fontSize: 15,
                  fontWeight: isActive ? 600 : 500,
                  padding: '10px 14px',
                  borderRadius: 8,
                  backgroundColor: isActive ? `${colors.accent}15` : 'transparent',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
