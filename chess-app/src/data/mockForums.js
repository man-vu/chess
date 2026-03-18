export const forumCategories = [
  { id: 'general', name: 'General Discussion', description: 'Talk about anything chess-related', icon: 'chat' },
  { id: 'strategy', name: 'Strategy & Tactics', description: 'Discuss strategic concepts and tactical patterns', icon: 'target' },
  { id: 'openings', name: 'Openings', description: 'Opening theory, repertoires, and analysis', icon: 'book' },
  { id: 'endgames', name: 'Endgames', description: 'Endgame technique and study', icon: 'flag' },
  { id: 'off-topic', name: 'Off-Topic', description: 'Non-chess discussions', icon: 'coffee' },
];

export const mockThreads = [
  {
    id: 'thread-1', forumId: 'general', title: 'What got you into chess?',
    content: 'I started playing chess after watching The Queen\'s Gambit. What\'s your story?',
    author: { id: 'bot-10', username: 'BlitzKing42', elo: 1590 },
    date: '2026-03-15T10:30:00Z', views: 234,
    replies: [
      { id: 'r-1', content: 'My grandfather taught me when I was 6. Been hooked ever since!', author: { id: 'bot-5', username: 'RookEndgame', elo: 1980 }, date: '2026-03-15T11:00:00Z' },
      { id: 'r-2', content: 'Bobby Fischer\'s games inspired me. The man was a genius.', author: { id: 'bot-1', username: 'GrandMaster_X', elo: 2450 }, date: '2026-03-15T12:30:00Z' },
      { id: 'r-3', content: 'Started in college chess club. Now I can\'t stop!', author: { id: 'bot-13', username: 'PatzerPete', elo: 1390 }, date: '2026-03-15T14:00:00Z' },
    ],
  },
  {
    id: 'thread-2', forumId: 'strategy', title: 'How to improve at positional chess?',
    content: 'I\'m around 1500 ELO and my tactical skills are decent, but I struggle with quiet positions. Any tips for improving positional understanding?',
    author: { id: 'bot-11', username: 'OpeningSavant', elo: 1520 },
    date: '2026-03-14T08:15:00Z', views: 567,
    replies: [
      { id: 'r-4', content: 'Study Karpov\'s games. He was the ultimate positional player.', author: { id: 'bot-21', username: 'PositionalPaul', elo: 1950 }, date: '2026-03-14T09:00:00Z' },
      { id: 'r-5', content: 'Learn about pawn structures. Pawns are the soul of chess!', author: { id: 'bot-7', username: 'PawnStorm', elo: 1780 }, date: '2026-03-14T10:30:00Z' },
    ],
  },
  {
    id: 'thread-3', forumId: 'openings', title: 'Best response to 1.d4?',
    content: 'I\'ve been playing the King\'s Indian but I\'m getting crushed in the Bayonet Attack. Should I switch to the Nimzo-Indian?',
    author: { id: 'bot-17', username: 'TacticalTina', elo: 1920 },
    date: '2026-03-13T16:45:00Z', views: 345,
    replies: [
      { id: 'r-6', content: 'The Nimzo is solid but you need to know your stuff in the Queen\'s Gambit structures too when they play 3.Nf3.', author: { id: 'bot-3', username: 'KnightRider', elo: 2180 }, date: '2026-03-13T17:30:00Z' },
      { id: 'r-7', content: 'Try the Grunfeld! Dynamic and counterattacking.', author: { id: 'bot-22', username: 'SacrificeSam', elo: 1820 }, date: '2026-03-13T18:15:00Z' },
      { id: 'r-8', content: 'The Slav Defense is underrated. Very solid for all levels.', author: { id: 'bot-9', username: 'SilentBishop', elo: 1650 }, date: '2026-03-14T07:00:00Z' },
    ],
  },
  {
    id: 'thread-4', forumId: 'endgames', title: 'Lucena Position - step by step guide',
    content: 'Can someone explain the Lucena position technique? I keep messing it up in rook endings.',
    author: { id: 'bot-15', username: 'NoviceKnight', elo: 1240 },
    date: '2026-03-12T12:00:00Z', views: 189,
    replies: [
      { id: 'r-9', content: 'The key is the "bridge" technique. First, get your king to the 6th rank beside the pawn. Then build a bridge with your rook to block checks.', author: { id: 'bot-5', username: 'RookEndgame', elo: 1980 }, date: '2026-03-12T13:00:00Z' },
    ],
  },
  {
    id: 'thread-5', forumId: 'general', title: 'Your most memorable game?',
    content: 'Share the game you\'re most proud of or that taught you the most!',
    author: { id: 'bot-6', username: 'CasualKing', elo: 1850 },
    date: '2026-03-11T20:00:00Z', views: 412,
    replies: [
      { id: 'r-10', content: 'I once came back from being down a queen by finding a perpetual check. Never resign!', author: { id: 'bot-8', username: 'Checkmate_Pro', elo: 1720 }, date: '2026-03-11T21:00:00Z' },
      { id: 'r-11', content: 'My first tournament win where I played a clean positional game. No tactics needed.', author: { id: 'bot-21', username: 'PositionalPaul', elo: 1950 }, date: '2026-03-12T08:00:00Z' },
    ],
  },
  {
    id: 'thread-6', forumId: 'off-topic', title: 'Chess movies and TV shows recommendations',
    content: 'Besides Queen\'s Gambit, what chess-related media do you enjoy?',
    author: { id: 'bot-14', username: 'CoffeeChess', elo: 1310 },
    date: '2026-03-10T15:30:00Z', views: 156,
    replies: [
      { id: 'r-12', content: 'Searching for Bobby Fischer is a classic!', author: { id: 'bot-20', username: 'KingHunt', elo: 1680 }, date: '2026-03-10T16:00:00Z' },
    ],
  },
  {
    id: 'thread-7', forumId: 'strategy', title: 'When to exchange pieces?',
    content: 'I never know when I should be trading pieces and when I should keep them on the board. Any guidelines?',
    author: { id: 'bot-12', username: 'ForkMaster', elo: 1480 },
    date: '2026-03-09T11:00:00Z', views: 298,
    replies: [
      { id: 'r-13', content: 'Trade when ahead in material, trade when cramped, keep pieces when attacking.', author: { id: 'bot-18', username: 'EndgameEagle', elo: 2100 }, date: '2026-03-09T12:30:00Z' },
      { id: 'r-14', content: 'Also trade your bad bishop for their good bishop whenever possible!', author: { id: 'bot-4', username: 'BishopPair', elo: 2050 }, date: '2026-03-09T13:45:00Z' },
    ],
  },
];
