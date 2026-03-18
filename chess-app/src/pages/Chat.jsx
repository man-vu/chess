import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/common/Avatar';
import { getItem, setItem } from '../utils/storage';
import { formatTimeAgo } from '../utils/formatters';
import { colors, commonStyles, spacing, borderRadius } from '../theme';
import { v4 as uuidv4 } from 'uuid';

const BOT_MESSAGES = [
  'Anyone want to play a game?',
  'Just won a beautiful game with a knight sacrifice!',
  'The Sicilian Defense is so sharp',
  'I love this platform',
  'Can someone explain the Philidor position?',
  'GG everyone',
  'Who\'s up for a tournament?',
  'Just hit a new ELO high!',
  'What\'s everyone\'s favorite opening?',
  'The endgame is where games are won',
];

export default function Chat() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [onlineCount] = useState(Math.floor(Math.random() * 50) + 20);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages(getItem('chess_chat_messages', []));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      const players = getItem('chess_players', []);
      const bot = players[Math.floor(Math.random() * players.length)];
      if (!bot) return;
      const msg = {
        id: uuidv4(),
        content: BOT_MESSAGES[Math.floor(Math.random() * BOT_MESSAGES.length)],
        author: { id: bot.id, username: bot.username },
        date: new Date().toISOString(),
      };
      setMessages((prev) => {
        const updated = [...prev, msg];
        setItem('chess_chat_messages', updated.slice(-100));
        return updated;
      });
    }, 8000 + Math.random() * 12000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !currentUser) return;
    const msg = {
      id: uuidv4(),
      content: input.trim(),
      author: { id: currentUser.id, username: currentUser.username },
      date: new Date().toISOString(),
    };
    setMessages((prev) => {
      const updated = [...prev, msg];
      setItem('chess_chat_messages', updated.slice(-100));
      return updated;
    });
    setInput('');
  };

  return (
    <div style={commonStyles.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <h1 style={{ color: colors.text, margin: 0 }}>Global Chat</h1>
        <span style={{ color: colors.accent, fontSize: 14 }}>{onlineCount} online</span>
      </div>
      <div style={{ ...commonStyles.card, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: spacing.md }}>
          {messages.map((msg) => {
            const isOwn = currentUser && msg.author.id === currentUser.id;
            const isSystem = msg.author.username === 'System';
            return (
              <div key={msg.id} style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.md, alignItems: 'flex-start' }}>
                {!isSystem && <Avatar username={msg.author.username} size={28} />}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: 2 }}>
                    <span style={{ color: isSystem ? colors.textMuted : isOwn ? colors.accent : colors.text, fontWeight: 600, fontSize: 13 }}>
                      {msg.author.username}
                    </span>
                    <span style={{ color: colors.textMuted, fontSize: 11 }}>{formatTimeAgo(msg.date)}</span>
                  </div>
                  <p style={{ color: isSystem ? colors.textMuted : colors.textSecondary, margin: 0, fontSize: 14, lineHeight: 1.4 }}>{msg.content}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <div style={{ borderTop: `1px solid ${colors.border}`, padding: spacing.md }}>
          {currentUser ? (
            <form onSubmit={sendMessage} style={{ display: 'flex', gap: spacing.sm }}>
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." style={{ ...commonStyles.input, flex: 1 }} />
              <button type="submit" style={commonStyles.button}>Send</button>
            </form>
          ) : (
            <p style={{ color: colors.textMuted, textAlign: 'center', margin: 0, fontSize: 14 }}>Sign in to chat</p>
          )}
        </div>
      </div>
    </div>
  );
}
