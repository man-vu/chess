import { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/common/Avatar';
import { getItem, setItem } from '../utils/storage';
import { formatTimeAgo } from '../utils/formatters';
import { colors, commonStyles, spacing, borderRadius, shadows, transitions } from '../theme';
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
    setNewThreadTitle(''); setNewThreadContent(''); setShowNewThread(false);
    setRefresh((r) => r + 1);
  };

  const BackBtn = ({ onClick, label }) => (
    <button onClick={onClick} style={{
      ...commonStyles.buttonSecondary, marginBottom: spacing.md, fontSize: 13,
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <span style={{ fontSize: 16 }}>&larr;</span> {label}
    </button>
  );

  if (thread) {
    return (
      <div style={commonStyles.page}>
        <BackBtn onClick={() => setSelectedThread(null)} label="Back to threads" />
        <div style={{ ...commonStyles.card, animation: 'fadeIn 300ms ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
            <Avatar username={thread.author.username} size={36} />
            <div>
              <span style={{ color: colors.text, fontWeight: 600 }}>{thread.author.username}</span>
              <span style={{ color: colors.textDark, fontSize: 12, marginLeft: 8 }}>{thread.author.elo} ELO</span>
              <div style={{ color: colors.textDark, fontSize: 12 }}>{formatTimeAgo(thread.date)}</div>
            </div>
          </div>
          <h2 style={{ color: colors.text, marginTop: 0, marginBottom: spacing.sm, fontWeight: 700, letterSpacing: '-0.01em' }}>{thread.title}</h2>
          <p style={{ color: colors.textSecondary, lineHeight: 1.7, marginBottom: spacing.lg }}>{thread.content}</p>
          <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: spacing.md }}>
            <h4 style={{ color: colors.textSecondary, marginTop: 0, marginBottom: spacing.md, fontWeight: 600 }}>{thread.replies.length} Replies</h4>
            {thread.replies.map((reply) => (
              <div key={reply.id} style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.md, paddingBottom: spacing.md, borderBottom: `1px solid ${colors.border}` }}>
                <Avatar username={reply.author.username} size={32} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: 4 }}>
                    <span style={{ color: colors.text, fontWeight: 600, fontSize: 14 }}>{reply.author.username}</span>
                    <span style={{ color: colors.textDark, fontSize: 11 }}>{formatTimeAgo(reply.date)}</span>
                  </div>
                  <p style={{ color: colors.textSecondary, fontSize: 14, margin: 0, lineHeight: 1.6 }}>{reply.content}</p>
                </div>
              </div>
            ))}
            {currentUser ? (
              <form onSubmit={submitReply} style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.sm }}>
                <input value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="Write a reply..." style={{ ...commonStyles.input, flex: 1 }}
                  onFocus={(e) => { e.target.style.borderColor = colors.borderFocus; }}
                  onBlur={(e) => { e.target.style.borderColor = colors.borderLight; }}
                />
                <button type="submit" style={commonStyles.button}>Reply</button>
              </form>
            ) : (
              <p style={{ color: colors.textDark, fontSize: 13 }}>Sign in to reply</p>
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
        <BackBtn onClick={() => { setSelectedForum(null); setShowNewThread(false); }} label="Back to forums" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
          <h1 style={{ color: colors.text, margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>{category?.name}</h1>
          {currentUser && (
            <button onClick={() => setShowNewThread(!showNewThread)} style={{
              ...commonStyles.button,
              background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})`,
            }}>New Thread</button>
          )}
        </div>
        {showNewThread && (
          <form onSubmit={createThread} style={{ ...commonStyles.card, marginBottom: spacing.lg, display: 'flex', flexDirection: 'column', gap: spacing.sm, animation: 'fadeIn 200ms ease' }}>
            <input value={newThreadTitle} onChange={(e) => setNewThreadTitle(e.target.value)} placeholder="Thread title" style={commonStyles.input}
              onFocus={(e) => { e.target.style.borderColor = colors.borderFocus; }}
              onBlur={(e) => { e.target.style.borderColor = colors.borderLight; }}
            />
            <textarea value={newThreadContent} onChange={(e) => setNewThreadContent(e.target.value)} placeholder="What's on your mind?" rows={4} style={{ ...commonStyles.input, resize: 'vertical', fontFamily: 'inherit' }}
              onFocus={(e) => { e.target.style.borderColor = colors.borderFocus; }}
              onBlur={(e) => { e.target.style.borderColor = colors.borderLight; }}
            />
            <button type="submit" style={{ ...commonStyles.button, alignSelf: 'flex-end' }}>Create Thread</button>
          </form>
        )}
        {forumThreads.length === 0 ? (
          <div style={{ ...commonStyles.card, textAlign: 'center', padding: spacing.xxl, color: colors.textSecondary }}>No threads yet. Be the first to post!</div>
        ) : (
          <div style={{ ...commonStyles.card, padding: 0, overflow: 'hidden' }}>
            {forumThreads.map((t) => (
              <div key={t.id} onClick={() => setSelectedThread(t.id)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 20px', borderBottom: `1px solid ${colors.border}`,
                cursor: 'pointer', transition: `background-color ${transitions.fast}`,
              }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.bgHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ color: colors.text, fontWeight: 500, fontSize: 15, marginBottom: 4 }}>{t.title}</div>
                  <div style={{ color: colors.textDark, fontSize: 12 }}>by {t.author.username} &middot; {formatTimeAgo(t.date)}</div>
                </div>
                <div style={{ display: 'flex', gap: spacing.xl, alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: colors.accent, fontSize: 14, fontWeight: 600 }}>{t.replies.length}</div>
                    <div style={{ color: colors.textDark, fontSize: 11 }}>replies</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: colors.textSecondary, fontSize: 14, fontWeight: 600 }}>{t.views}</div>
                    <div style={{ color: colors.textDark, fontSize: 11 }}>views</div>
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
      <h1 style={{ color: colors.text, marginBottom: spacing.lg, fontWeight: 800, letterSpacing: '-0.02em' }}>Community Forums</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {categories.map((cat, i) => {
          const catThreads = threads.filter((t) => t.forumId === cat.id);
          const lastThread = catThreads[0];
          return (
            <div key={cat.id} onClick={() => setSelectedForum(cat.id)} style={{
              ...commonStyles.cardHoverable,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              animation: `fadeIn 300ms ease ${i * 60}ms both`,
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.transform = 'translateX(4px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.transform = 'translateX(0)'; }}
            >
              <div>
                <h3 style={{ color: colors.text, margin: '0 0 4px', fontWeight: 600 }}>{cat.name}</h3>
                <p style={{ color: colors.textSecondary, margin: 0, fontSize: 14, lineHeight: 1.5 }}>{cat.description}</p>
              </div>
              <div style={{ display: 'flex', gap: spacing.xl, alignItems: 'center', flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: colors.accent, fontSize: 18, fontWeight: 700 }}>{catThreads.length}</div>
                  <div style={{ color: colors.textDark, fontSize: 11 }}>threads</div>
                </div>
                {lastThread && (
                  <div style={{ textAlign: 'right', minWidth: 140 }}>
                    <div style={{ color: colors.textSecondary, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{lastThread.title}</div>
                    <div style={{ color: colors.textDark, fontSize: 11 }}>{formatTimeAgo(lastThread.date)}</div>
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
