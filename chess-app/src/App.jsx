import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import PlaySelect from './pages/PlaySelect';
import PlayAI from './pages/PlayAI';
import PlayLocal from './pages/PlayLocal';
import PlayOnline from './pages/PlayOnline';
import PlayMultiplayer from './pages/PlayMultiplayer';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import GameHistory from './pages/GameHistory';
import GameReplay from './pages/GameReplay';
import Forums from './pages/Forums';
import Chat from './pages/Chat';
import News from './pages/News';
import Tournaments from './pages/Tournaments';
import BoardEditor from './pages/BoardEditor';
import Puzzles from './pages/Puzzles';
import AnalysisBoard from './pages/AnalysisBoard';
import Achievements from './pages/Achievements';
import DailyChallenges from './pages/DailyChallenges';
import PlayerCompare from './pages/PlayerCompare';
import SpectateAI from './pages/SpectateAI';
import { useTheme } from './contexts/ThemeContext';

export default function App() {
  const { themeObject } = useTheme();

  return (
    <div style={{
      '--bg': themeObject.colors.bg,
      '--bg-card': themeObject.colors.bgCard,
      '--text': themeObject.colors.text,
    }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="play" element={<PlaySelect />} />
          <Route path="play/ai" element={<PlayAI />} />
          <Route path="play/local" element={<PlayLocal />} />
          <Route path="play/spectate" element={<SpectateAI />} />
          <Route path="play/online" element={<ProtectedRoute><PlayOnline /></ProtectedRoute>} />
          <Route path="play/multiplayer" element={<ProtectedRoute><PlayMultiplayer /></ProtectedRoute>} />
          <Route path="profile/:userId" element={<Profile />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="history" element={<ProtectedRoute><GameHistory /></ProtectedRoute>} />
          <Route path="history/:gameId" element={<ProtectedRoute><GameReplay /></ProtectedRoute>} />
          <Route path="community" element={<Forums />} />
          <Route path="chat" element={<Chat />} />
          <Route path="news" element={<News />} />
          <Route path="tournaments" element={<Tournaments />} />
          <Route path="editor" element={<BoardEditor />} />
          <Route path="puzzles" element={<Puzzles />} />
          <Route path="analysis" element={<AnalysisBoard />} />
          <Route path="achievements" element={<Achievements />} />
          <Route path="challenges" element={<DailyChallenges />} />
          <Route path="compare" element={<PlayerCompare />} />
        </Route>
      </Routes>
    </div>
  );
}
