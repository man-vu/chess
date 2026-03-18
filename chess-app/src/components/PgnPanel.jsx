import { useState, useCallback } from 'react';
import { colors, commonStyles, spacing, borderRadius, transitions, typography } from '../theme';

function formatPgnHeaders(game, pgn, gameResult, opponentName) {
  const today = new Date();
  const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
  const playerColor = game?.playerColor || 'w';
  const whiteName = playerColor === 'w' ? 'Player' : (opponentName || 'Opponent');
  const blackName = playerColor === 'b' ? 'Player' : (opponentName || 'Opponent');

  let resultTag = '*';
  if (gameResult === 'win') resultTag = playerColor === 'w' ? '1-0' : '0-1';
  else if (gameResult === 'loss') resultTag = playerColor === 'w' ? '0-1' : '1-0';
  else if (gameResult === 'draw') resultTag = '1/2-1/2';

  const headers = [
    `[Event "ChessArena Game"]`,
    `[Site "ChessArena"]`,
    `[Date "${dateStr}"]`,
    `[White "${whiteName}"]`,
    `[Black "${blackName}"]`,
    `[Result "${resultTag}"]`,
  ].join('\n');

  const moveText = pgn || game?.pgn || '';
  return `${headers}\n\n${moveText}`;
}

function getResultLabel(gameResult) {
  if (gameResult === 'win') return 'Victory';
  if (gameResult === 'loss') return 'Defeat';
  if (gameResult === 'draw') return 'Draw';
  return 'In Progress';
}

function getResultScore(game, gameResult) {
  if (!gameResult || gameResult === 'in_progress') return '*';
  const playerColor = game?.playerColor || 'w';
  if (gameResult === 'win') return playerColor === 'w' ? '1-0' : '0-1';
  if (gameResult === 'loss') return playerColor === 'w' ? '0-1' : '1-0';
  return '1/2-1/2';
}

export default function PgnPanel({ game, pgn, gameResult, opponentName, mode, onImport }) {
  const [importText, setImportText] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(null);

  const fullPgn = formatPgnHeaders(game, pgn, gameResult, opponentName);
  const isImportMode = mode === 'import';

  const showFeedback = useCallback((type) => {
    setCopyFeedback(type);
    setTimeout(() => setCopyFeedback(null), 1500);
  }, []);

  const handleCopyPgn = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullPgn);
      showFeedback('pgn');
    } catch {
      showFeedback('error');
    }
  }, [fullPgn, showFeedback]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([fullPgn], { type: 'application/x-chess-pgn' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const opponent = (opponentName || 'game').replace(/[^a-zA-Z0-9]/g, '_');
    a.download = `ChessArena_vs_${opponent}.pgn`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showFeedback('download');
  }, [fullPgn, opponentName, showFeedback]);

  const handleImport = useCallback(() => {
    if (onImport && importText.trim()) {
      onImport(importText.trim());
    }
  }, [onImport, importText]);

  const handleShare = useCallback(async () => {
    const moveText = pgn || game?.pgn || '';
    const moveCount = moveText.split(/\d+\./).filter(Boolean).length;
    const playerColor = game?.playerColor || 'w';
    const whiteName = playerColor === 'w' ? 'Player' : (opponentName || 'Opponent');
    const blackName = playerColor === 'b' ? 'Player' : (opponentName || 'Opponent');

    const summary = [
      `\u265F ChessArena Game`,
      `${whiteName} vs ${blackName}`,
      `Result: ${getResultScore(game, gameResult)} (${getResultLabel(gameResult)})`,
      `Moves: ${moveCount}`,
      ``,
      `[PGN]`,
      moveText,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summary);
      showFeedback('share');
    } catch {
      showFeedback('error');
    }
  }, [game, pgn, gameResult, opponentName, showFeedback]);

  const btnStyle = {
    ...commonStyles.buttonSecondary,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 600,
    flex: 1,
    textAlign: 'center',
    position: 'relative',
  };

  const feedbackStyle = {
    position: 'absolute',
    top: -24,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: colors.success,
    color: colors.white,
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: borderRadius.sm,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  };

  return (
    <div style={{
      ...commonStyles.card,
      padding: spacing.sm,
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.xs,
    }}>
      <div style={{
        color: colors.textDark,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        padding: `0 ${spacing.xs}px`,
      }}>
        PGN
      </div>

      <textarea
        value={isImportMode ? importText : fullPgn}
        onChange={isImportMode ? (e) => setImportText(e.target.value) : undefined}
        readOnly={!isImportMode}
        placeholder={isImportMode ? 'Paste PGN here...' : ''}
        style={{
          width: '100%',
          minHeight: 120,
          maxHeight: 200,
          padding: spacing.sm,
          backgroundColor: colors.bgInput,
          color: colors.textSecondary,
          border: `1px solid ${colors.borderLight}`,
          borderRadius: borderRadius.md,
          fontSize: 12,
          fontFamily: typography.monoFamily,
          lineHeight: 1.5,
          resize: 'vertical',
          outline: 'none',
          boxSizing: 'border-box',
          transition: `border-color ${transitions.fast}`,
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = colors.borderFocus; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = colors.borderLight; }}
        aria-label={isImportMode ? 'Import PGN text' : 'PGN notation'}
      />

      <div style={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap' }}>
        <button
          onClick={handleCopyPgn}
          style={btnStyle}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.bgHover; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          aria-label="Copy PGN to clipboard"
        >
          {copyFeedback === 'pgn' && <span style={feedbackStyle}>Copied!</span>}
          Copy PGN
        </button>
        <button
          onClick={handleDownload}
          style={btnStyle}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.bgHover; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          aria-label="Download PGN file"
        >
          {copyFeedback === 'download' && <span style={feedbackStyle}>Downloaded!</span>}
          Download
        </button>
      </div>

      <div style={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap' }}>
        <button
          onClick={handleShare}
          style={btnStyle}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.bgHover; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          aria-label="Copy game summary to clipboard"
        >
          {copyFeedback === 'share' && <span style={feedbackStyle}>Copied!</span>}
          Share
        </button>
        {onImport && (
          <button
            onClick={handleImport}
            disabled={isImportMode && !importText.trim()}
            style={{
              ...btnStyle,
              opacity: isImportMode && !importText.trim() ? 0.4 : 1,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.bgHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            aria-label="Import PGN"
          >
            Import PGN
          </button>
        )}
      </div>

      {copyFeedback === 'error' && (
        <div style={{ color: colors.error, fontSize: 11, textAlign: 'center' }}>
          Failed to copy to clipboard
        </div>
      )}
    </div>
  );
}
