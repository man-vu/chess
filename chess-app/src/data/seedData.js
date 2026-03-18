import { mockPlayers } from './mockPlayers';
import { mockNews } from './mockNews';
import { mockThreads, forumCategories } from './mockForums';
import { mockTournaments } from './mockTournaments';
import { getItem, setItem } from '../utils/storage';

export function seedData() {
  if (!getItem('chess_seeded')) {
    setItem('chess_players', mockPlayers);
    setItem('chess_news', mockNews);
    setItem('chess_forum_categories', forumCategories);
    setItem('chess_forum_threads', mockThreads);
    setItem('chess_tournaments', mockTournaments);
    setItem('chess_users', []);
    setItem('chess_games', []);
    setItem('chess_chat_messages', [
      { id: 'msg-1', content: 'Welcome to the chat! Be respectful and have fun.', author: { username: 'System' }, date: '2026-03-18T08:00:00Z' },
      { id: 'msg-2', content: 'Anyone up for a game?', author: { id: 'bot-10', username: 'BlitzKing42' }, date: '2026-03-18T08:05:00Z' },
      { id: 'msg-3', content: 'Just hit 2000 ELO! Feeling great!', author: { id: 'bot-17', username: 'TacticalTina' }, date: '2026-03-18T08:10:00Z' },
      { id: 'msg-4', content: 'The Sicilian Najdorf is the best opening. Change my mind.', author: { id: 'bot-1', username: 'GrandMaster_X' }, date: '2026-03-18T08:15:00Z' },
      { id: 'msg-5', content: 'Anyone tried the new tournament system?', author: { id: 'bot-6', username: 'CasualKing' }, date: '2026-03-18T08:20:00Z' },
    ]);
    setItem('chess_seeded', true);
  }
}
