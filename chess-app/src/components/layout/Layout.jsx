import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { colors } from '../../theme';

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg, display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <footer style={{ borderTop: `1px solid ${colors.border}`, padding: '16px 24px', textAlign: 'center', color: colors.textMuted, fontSize: 13, backgroundColor: colors.bgDeep }}>
        ChessArena &copy; 2026 &mdash; Play, Learn, Compete
      </footer>
    </div>
  );
}
