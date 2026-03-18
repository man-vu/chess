import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { colors, spacing, transitions } from '../../theme';

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg, display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, animation: 'fadeIn 300ms ease' }}>
        <Outlet />
      </main>
      <footer style={{
        borderTop: `1px solid ${colors.border}`,
        padding: `${spacing.md}px ${spacing.lg}px`,
        textAlign: 'center',
        color: colors.textDark,
        fontSize: 13,
        backgroundColor: colors.bgDeep,
        letterSpacing: '0.01em',
      }}>
        ChessArena &copy; 2026 &mdash; Play, Learn, Compete
      </footer>
    </div>
  );
}
