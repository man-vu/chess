import { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import { getItem, setItem } from '../utils/storage';
import { formatTimeAgo } from '../utils/formatters';
import { colors, commonStyles, spacing, borderRadius } from '../theme';
import { v4 as uuidv4 } from 'uuid';

export default function Forums() {
  const { currentUser } = useAuth();
  const [selectedForum, setSelectedForum] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [showNewThread, setShowNewThread] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const categories = useMemo(() => getItem('chess_forum_categories', []), []);
  const threads = useMemo(() => getItem('chess_forum_threads', []), [refresh]);

  const forumThreads = selectedForum ? threads.filter((t) => t.forumId === selectedForum) : [];
  const thread = selectedThread ? threads.find((t) => t.id === selectedThread) : null;

  const submitReply = (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !currentUser) return;
    const allThreads = getItem('chess_forum_threads', []);
    const idx = allThreads.findIndex((t) => t.id === selectedThread);
    if (idx === -1) return;
    allThreads[idx].replies.push({
      id: uuidv4(), content: replyContent.trim(),
      author: { id: currentUser.id, username: currentUser.username, elo: currentUser.elo },
      date: new Date().toISOString(),
    });
    setItem('chess_forum_threads', allThreads);
    setReplyContent('');
    setRefresh((r) => r + 1);
  };

  const createThread = (e) => {
    e.preventDefault();
    if (!newThreadTitle.trim() || !newThreadContent.trim() || !currentUser) return;
    const allThreads = getItem('chess_forum_threads', []);
    allThreads.unshift({
      id: uuidv4(), forumId: selectedForum, title: newThreadTitle.trim(), content: newThreadContent.trim(),
      author: { id: currentUser.id, username: currentUser.username, elo: currentUser.elo },
      date: new Date().toISOString(), views: 0, replies: [],
    });
    setItem('chess_forum_threads', allThreads);
    setNewThreadTitle('');
    setNewThreadContent('');
    setShowNewThread(false);
    setRefresh((r) => r + 1);
  };

  if (thread) {
    return (
      <div style={commonStyles.page}>
        <button onClick={() => setSelectedThread(null)} style={{ ...commonStyles.buttonSecondary, marginBottom: spacing.md, fontSize: 13 }}>
          {'<'} Back to threads
        </button>
        <div style={commonStyles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
            <Avatar username={thread.author.username} size={36} />
            <div>
              <span style={{ color: colors.text, fontWeight: 600 }}>{thread.author.username}</span>
              <span style={{ color: colors.textMuted, fontSize: 12, marginLeft: 8 }}>{thread.author.elo} ELO</span>
              <div style={{ color: colors.textMuted, fontSize: 12 }}>{formatTimeAgo(thread.date)}</div>
            </div>
          </div>
          <h2 style={{ color: colors.text, marginTop: 0, marginBottom: spacing.sm }}>{thread.title}</h2>
          <p style={{ color: colors.textSecondary, lineHeight: 1.6, marginBottom: spacing.lg }}>{thread.content}</p>
          <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: spacing.md }}>
            <h4 style={{ color: colors.textSecondary, marginTop: 0, marginBottom: spacing.md }}>{thread.replies.length} Replies</h4>
            {thread.replies.map((reply) => (
              <div key={reply.id} style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.md, paddingBottom: spacing.md, borderBottom: `1px solid ${colors.border}` }}>
                <Avatar username={reply.author.username} size={32} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: 4 }}>
                    <span style={{ color: colors.text, fontWeight: 600, fontSize: 14 }}>{reply.author.username}</span>
                    <span style={{ color: colors.textMuted, fontSize: 11 }}>{formatTimeAgo(reply.date)}</span>
                  </div>
                  <p style={{ color: colors.textSecondary, fontSize: 14, margin: 0, lineHeight: 1.5 }}>{reply.content}</p>
                </div>
              </div>
            ))}
            {currentUser ? (
              <form onSubmit={submitReply} style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.sm }}>
                <input value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="Write a reply..." style={{ ...commonStyles.input, flex: 1 }} />
                <button type="submit" style={commonStyles.button}>Reply</button>
              </form>
            ) : (
              <p style={{ color: colors.textMuted, fontSize: 13 }}>Sign in to reply</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (selectedForum) {
    const category = categories.find((c) => c.id === selectedForum);
    return (
      <div style={commonStyles.page}>
        <button onClick={() => { setSelectedForum(null); setShowNewThread(false); }} style={{ ...commonStyles.buttonSecondary, marginBottom: spacing.md, fontSize: 13 }}>
          {'<'} Back to forums
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
          <h1 style={{ color: colors.text, margin: 0 }}>{category?.name}</h1>
          {currentUser && (
            <button onClick={() => setShowNewThread(!showNewThread)} style={commonStyles.button}>New Thread</button>
          )}
        </div>
        {showNewThread && (
          <form onSubmit={createThread} style={{ ...commonStyles.card, marginBottom: spacing.lg, display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            <input value={newThreadTitle} onChange={(e) => setNewThreadTitle(e.target.value)} placeholder="Thread title" style={commonStyles.input} />
            <textarea value={newThreadContent} onChange={(e) => setNewThreadContent(e.target.value)} placeholder="What's on your mind?" rows={4} style={{ ...commonStyles.input, resize: 'vertical', fontFamily: 'inherit' }} />
            <button type="submit" style={{ ...commonStyles.button, alignSelf: 'flex-end' }}>Create Thread</button>
          </form>
        )}
        {forumThreads.length === 0 ? (
          <div style={{ ...commonStyles.card, textAlign: 'center', padding: spacing.xxl, color: colors.textSecondary }}>No threads yet. Be the first to post!</div>
        ) : (
          <div style={commonStyles.card}>
            {forumThreads.map((t) => (
              <div key={t.id} onClick={() => setSelectedThread(t.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${colors.border}`, cursor: 'pointer' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: colors.text, fontWeight: 500, fontSize: 15, marginBottom: 4 }}>{t.title}</div>
                  <div style={{ color: colors.textMuted, fontSize: 12 }}>by {t.author.username} &middot; {formatTimeAgo(t.date)}</div>
                </div>
                <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: colors.textSecondary, fontSize: 14, fontWeight: 600 }}>{t.replies.length}</div>
                    <div style={{ color: colors.textMuted, fontSize: 11 }}>replies</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: colors.textSecondary, fontSize: 14, fontWeight: 600 }}>{t.views}</div>
                    <div style={{ color: colors.textMuted, fontSize: 11 }}>views</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={commonStyles.page}>
      <h1 style={{ color: colors.text, marginBottom: spacing.lg }}>Community Forums</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {categories.map((cat) => {
          const catThreads = threads.filter((t) => t.forumId === cat.id);
          const lastThread = catThreads[0];
          return (
            <div key={cat.id} onClick={() => setSelectedForum(cat.id)} style={{ ...commonStyles.card, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border-color 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; }}
            >
              <div>
                <h3 style={{ color: colors.text, margin: '0 0 4px' }}>{cat.name}</h3>
                <p style={{ color: colors.textSecondary, margin: 0, fontSize: 14 }}>{cat.description}</p>
              </div>
              <div style={{ display: 'flex', gap: spacing.xl, alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: colors.accent, fontSize: 18, fontWeight: 700 }}>{catThreads.length}</div>
                  <div style={{ color: colors.textMuted, fontSize: 11 }}>threads</div>
                </div>
                {lastThread && (
                  <div style={{ textAlign: 'right', minWidth: 140 }}>
                    <div style={{ color: colors.textSecondary, fontSize: 13 }}>{lastThread.title.slice(0, 25)}{lastThread.title.length > 25 ? '...' : ''}</div>
                    <div style={{ color: colors.textMuted, fontSize: 11 }}>{formatTimeAgo(lastThread.date)}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
