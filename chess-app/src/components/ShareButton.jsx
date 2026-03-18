import { useState, useRef, useEffect, useCallback } from 'react';
import { colors, borderRadius, spacing, shadows, transitions } from '../theme';

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="12" cy="3" r="2" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="4" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="13" r="2" stroke="currentColor" strokeWidth="1.5" />
    <line x1="5.8" y1="7" x2="10.2" y2="4" stroke="currentColor" strokeWidth="1.5" />
    <line x1="5.8" y1="9" x2="10.2" y2="12" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export default function ShareButton({ gameId, pgn, result, opponentName, moveCount }) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const containerRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);

  const showFeedback = useCallback((label) => {
    setFeedback(label);
    setTimeout(() => {
      setFeedback(null);
      close();
    }, 1000);
  }, [close]);

  const copyPgn = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pgn || '');
      showFeedback('pgn');
    } catch { /* ignore */ }
  }, [pgn, showFeedback]);

  const copyLink = useCallback(async () => {
    try {
      const url = `${window.location.origin}/history/${gameId}`;
      await navigator.clipboard.writeText(url);
      showFeedback('link');
    } catch { /* ignore */ }
  }, [gameId, showFeedback]);

  const copySummary = useCallback(async () => {
    const resultLabel = result === 'win' ? 'Victory' : result === 'loss' ? 'Defeat' : result === 'draw' ? 'Draw' : 'Unknown';
    const summary = [
      `\u265F ChessArena Game`,
      `vs ${opponentName || 'Opponent'}`,
      `Result: ${resultLabel}`,
      `Moves: ${moveCount || 0}`,
      '',
      pgn || '',
    ].join('\n');
    try {
      await navigator.clipboard.writeText(summary);
      showFeedback('summary');
    } catch { /* ignore */ }
  }, [result, opponentName, moveCount, pgn, showFeedback]);

  const btnBase = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '8px 12px',
    border: 'none',
    background: 'transparent',
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    borderRadius: borderRadius.sm,
    transition: `background-color ${transitions.fast}, color ${transitions.fast}`,
    textAlign: 'left',
  };

  const options = [
    { key: 'pgn', label: 'Copy PGN', onClick: copyPgn },
    { key: 'link', label: 'Copy Link', onClick: copyLink },
    { key: 'summary', label: 'Copy Summary', onClick: copySummary },
  ];

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          backgroundColor: 'transparent',
          color: colors.textSecondary,
          border: `1px solid ${colors.borderLight}`,
          borderRadius: borderRadius.md,
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          transition: `all ${transitions.fast}`,
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.bgHover;
          e.currentTarget.style.color = colors.text;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = colors.textSecondary;
        }}
        aria-label="Share game"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <ShareIcon />
        Share
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            minWidth: 160,
            backgroundColor: colors.bgElevated,
            border: `1px solid ${colors.border}`,
            borderRadius: borderRadius.md,
            boxShadow: shadows.md,
            padding: spacing.xs,
            zIndex: 100,
          }}
        >
          {options.map(({ key, label, onClick }) => (
            <button
              key={key}
              onClick={onClick}
              role="menuitem"
              style={btnBase}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bgHover;
                e.currentTarget.style.color = colors.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.textSecondary;
              }}
            >
              {feedback === key ? (
                <span style={{ color: colors.success, fontWeight: 600 }}>Copied!</span>
              ) : (
                label
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
