import { useState, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import { useNavigate } from 'react-router-dom';
import { PIECE_SYMBOLS, FILES, RANKS } from '../constants';
import ChessPiece from '../components/ChessPiece';
import { colors, commonStyles, spacing, borderRadius, shadows, transitions, typography } from '../theme';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const PIECE_TYPES = [
  { key: 'wk', fen: 'K', label: 'King' },
  { key: 'wq', fen: 'Q', label: 'Queen' },
  { key: 'wr', fen: 'R', label: 'Rook' },
  { key: 'wb', fen: 'B', label: 'Bishop' },
  { key: 'wn', fen: 'N', label: 'Knight' },
  { key: 'wp', fen: 'P', label: 'Pawn' },
  { key: 'bk', fen: 'k', label: 'King' },
  { key: 'bq', fen: 'q', label: 'Queen' },
  { key: 'br', fen: 'r', label: 'Rook' },
  { key: 'bb', fen: 'b', label: 'Bishop' },
  { key: 'bn', fen: 'n', label: 'Knight' },
  { key: 'bp', fen: 'p', label: 'Pawn' },
];

const FEN_TO_PIECE_KEY = {
  K: 'wk', Q: 'wq', R: 'wr', B: 'wb', N: 'wn', P: 'wp',
  k: 'bk', q: 'bq', r: 'br', b: 'bb', n: 'bn', p: 'bp',
};

function createEmptyBoard() {
  return Array(64).fill(null);
}

function fenToBoard(fen) {
  const board = createEmptyBoard();
  const placement = fen.split(' ')[0];
  let rank = 0;
  let file = 0;
  for (const ch of placement) {
    if (ch === '/') {
      rank++;
      file = 0;
    } else if (ch >= '1' && ch <= '8') {
      file += parseInt(ch);
    } else {
      if (rank < 8 && file < 8) {
        board[rank * 8 + file] = FEN_TO_PIECE_KEY[ch] || null;
      }
      file++;
    }
  }
  return board;
}

function boardToFenPlacement(board) {
  const PIECE_KEY_TO_FEN = {};
  for (const [fen, key] of Object.entries(FEN_TO_PIECE_KEY)) {
    PIECE_KEY_TO_FEN[key] = fen;
  }
  let fen = '';
  for (let rank = 0; rank < 8; rank++) {
    let empty = 0;
    for (let file = 0; file < 8; file++) {
      const piece = board[rank * 8 + file];
      if (piece) {
        if (empty > 0) { fen += empty; empty = 0; }
        fen += PIECE_KEY_TO_FEN[piece];
      } else {
        empty++;
      }
    }
    if (empty > 0) fen += empty;
    if (rank < 7) fen += '/';
  }
  return fen;
}

function buildFen(board, turn, castling, enPassant, halfmove, fullmove) {
  const placement = boardToFenPlacement(board);
  const castlingStr = castling || '-';
  const ep = enPassant || '-';
  return `${placement} ${turn} ${castlingStr} ${ep} ${halfmove} ${fullmove}`;
}

function validateFen(fen) {
  try {
    new Chess(fen);
    return { valid: true, error: null };
  } catch (e) {
    return { valid: false, error: e.message || 'Invalid FEN' };
  }
}

export default function BoardEditor() {
  const navigate = useNavigate();
  const [board, setBoard] = useState(() => fenToBoard(STARTING_FEN));
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [turn, setTurn] = useState('w');
  const [castling, setCastling] = useState({ K: true, Q: true, k: true, q: true });
  const [flipped, setFlipped] = useState(false);
  const [fenInput, setFenInput] = useState(STARTING_FEN);
  const [fenError, setFenError] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const castlingStr = useMemo(() => {
    let s = '';
    if (castling.K) s += 'K';
    if (castling.Q) s += 'Q';
    if (castling.k) s += 'k';
    if (castling.q) s += 'q';
    return s || '-';
  }, [castling]);

  const currentFen = useMemo(() => {
    return buildFen(board, turn, castlingStr, '-', 0, 1);
  }, [board, turn, castlingStr]);

  const fenValidation = useMemo(() => validateFen(currentFen), [currentFen]);

  const syncFenInput = useCallback((newBoard, newTurn, newCastlingStr) => {
    const fen = buildFen(newBoard, newTurn, newCastlingStr, '-', 0, 1);
    setFenInput(fen);
    setFenError(null);
  }, []);

  const handleSquareClick = useCallback((index) => {
    setBoard(prev => {
      const next = [...prev];
      if (selectedPiece) {
        if (next[index] === selectedPiece) {
          next[index] = null;
        } else {
          next[index] = selectedPiece;
        }
      } else {
        next[index] = null;
      }
      const cs = castlingStr;
      syncFenInput(next, turn, cs);
      return next;
    });
  }, [selectedPiece, turn, castlingStr, syncFenInput]);

  const handlePieceSelect = useCallback((key) => {
    setSelectedPiece(prev => prev === key ? null : key);
  }, []);

  const handleFenInputChange = useCallback((e) => {
    const val = e.target.value;
    setFenInput(val);
    setFenError(null);
  }, []);

  const applyFen = useCallback(() => {
    const trimmed = fenInput.trim();
    const result = validateFen(trimmed);
    if (!result.valid) {
      setFenError(result.error);
      return;
    }
    setBoard(fenToBoard(trimmed));
    const parts = trimmed.split(' ');
    setTurn(parts[1] || 'w');
    const c = parts[2] || '-';
    setCastling({
      K: c.includes('K'),
      Q: c.includes('Q'),
      k: c.includes('k'),
      q: c.includes('q'),
    });
    setFenError(null);
  }, [fenInput]);

  const handleFenKeyDown = useCallback((e) => {
    if (e.key === 'Enter') applyFen();
  }, [applyFen]);

  const loadStarting = useCallback(() => {
    setBoard(fenToBoard(STARTING_FEN));
    setTurn('w');
    setCastling({ K: true, Q: true, k: true, q: true });
    setFenInput(STARTING_FEN);
    setFenError(null);
  }, []);

  const clearBoard = useCallback(() => {
    setBoard(createEmptyBoard());
    setTurn('w');
    setCastling({ K: false, Q: false, k: false, q: false });
    const fen = buildFen(createEmptyBoard(), 'w', '-', '-', 0, 1);
    setFenInput(fen);
    setFenError(null);
  }, []);

  const handleTurnChange = useCallback((newTurn) => {
    setTurn(newTurn);
    setBoard(prev => {
      syncFenInput(prev, newTurn, castlingStr);
      return prev;
    });
  }, [castlingStr, syncFenInput]);

  const handleCastlingChange = useCallback((right) => {
    setCastling(prev => {
      const next = { ...prev, [right]: !prev[right] };
      let s = '';
      if (next.K) s += 'K';
      if (next.Q) s += 'Q';
      if (next.k) s += 'k';
      if (next.q) s += 'q';
      syncFenInput(board, turn, s || '-');
      return next;
    });
  }, [board, turn, syncFenInput]);

  const copyFen = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentFen);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = currentFen;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    }
  }, [currentFen]);

  const playFromPosition = useCallback(() => {
    if (!fenValidation.valid) return;
    localStorage.setItem('chess_custom_fen', currentFen);
    navigate('/play/local');
  }, [currentFen, fenValidation, navigate]);

  const ranks = flipped ? [...RANKS].reverse() : RANKS;
  const files = flipped ? [...FILES].reverse() : FILES;

  const styles = {
    container: {
      ...commonStyles.page,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    title: {
      color: colors.text,
      marginBottom: spacing.lg,
      fontWeight: 700,
      letterSpacing: '-0.02em',
      ...typography.h2,
    },
    layout: {
      display: 'flex',
      gap: spacing.lg,
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    boardWrapper: {
      display: 'inline-block',
      borderRadius: 6,
      overflow: 'hidden',
      boxShadow: shadows.board,
      border: `3px solid ${colors.boardBorder}`,
    },
    sidebar: {
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.md,
      width: 260,
      minWidth: 240,
    },
    sectionCard: {
      ...commonStyles.card,
      padding: spacing.md,
    },
    sectionLabel: {
      ...typography.label,
      color: colors.textMuted,
      marginBottom: spacing.sm,
      display: 'block',
    },
    paletteGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gap: 4,
    },
    paletteItem: (isSelected) => ({
      width: 38,
      height: 38,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 26,
      cursor: 'pointer',
      borderRadius: borderRadius.sm,
      border: isSelected ? `2px solid ${colors.accent}` : `2px solid transparent`,
      backgroundColor: isSelected ? colors.accentLight : 'transparent',
      transition: `all ${transitions.fast}`,
      userSelect: 'none',
    }),
    paletteLabel: {
      ...typography.tiny,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 2,
    },
    turnRow: {
      display: 'flex',
      gap: spacing.xs,
    },
    turnButton: (active) => ({
      flex: 1,
      padding: '8px 12px',
      backgroundColor: active ? colors.accentLight : 'transparent',
      color: active ? colors.accent : colors.textSecondary,
      border: active ? `1px solid ${colors.accent}` : `1px solid ${colors.borderLight}`,
      borderRadius: borderRadius.md,
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: typography.fontFamily,
      transition: `all ${transitions.fast}`,
      outline: 'none',
    }),
    castlingRow: {
      display: 'flex',
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    castlingCheck: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      cursor: 'pointer',
      userSelect: 'none',
    },
    checkbox: (checked) => ({
      width: 18,
      height: 18,
      borderRadius: borderRadius.sm,
      border: checked ? `2px solid ${colors.accent}` : `2px solid ${colors.borderLight}`,
      backgroundColor: checked ? colors.accent : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: `all ${transitions.fast}`,
      fontSize: 11,
      color: colors.white,
      fontWeight: 700,
    }),
    checkLabel: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: 500,
    },
    fenRow: {
      display: 'flex',
      gap: spacing.xs,
    },
    fenInput: {
      ...commonStyles.input,
      fontFamily: typography.monoFamily,
      fontSize: 12,
      padding: '8px 10px',
      flex: 1,
    },
    fenApplyBtn: {
      ...commonStyles.buttonSecondary,
      padding: '8px 14px',
      fontSize: 12,
      whiteSpace: 'nowrap',
    },
    fenError: {
      color: colors.error,
      fontSize: 12,
      marginTop: 4,
    },
    quickActions: {
      display: 'flex',
      gap: spacing.xs,
      flexWrap: 'wrap',
    },
    smallBtn: {
      ...commonStyles.buttonSecondary,
      padding: '7px 12px',
      fontSize: 12,
      flex: 1,
      textAlign: 'center',
    },
    playButton: {
      ...commonStyles.button,
      width: '100%',
      background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})`,
      fontSize: 15,
      padding: '12px 20px',
    },
    playButtonDisabled: {
      ...commonStyles.button,
      width: '100%',
      backgroundColor: colors.bgHover,
      color: colors.textMuted,
      cursor: 'not-allowed',
      fontSize: 15,
      padding: '12px 20px',
    },
    validationBadge: (valid) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '4px 10px',
      borderRadius: borderRadius.sm,
      fontSize: 12,
      fontWeight: 600,
      backgroundColor: valid ? 'rgba(124,179,66,0.12)' : 'rgba(239,68,68,0.12)',
      color: valid ? colors.success : colors.error,
      marginTop: spacing.xs,
    }),
    eraserBtn: (isSelected) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      padding: '6px 0',
      marginTop: spacing.xs,
      borderRadius: borderRadius.sm,
      border: isSelected ? `2px solid ${colors.error}` : `2px solid ${colors.borderLight}`,
      backgroundColor: isSelected ? 'rgba(239,68,68,0.12)' : 'transparent',
      color: isSelected ? colors.error : colors.textSecondary,
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 600,
      fontFamily: typography.fontFamily,
      transition: `all ${transitions.fast}`,
      outline: 'none',
    }),
    rankLabel: {
      width: 24,
      height: 72,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 12,
      fontWeight: 600,
      color: colors.textMuted,
      backgroundColor: colors.bgDeep,
      userSelect: 'none',
    },
    fileLabel: {
      width: 72,
      height: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 12,
      fontWeight: 600,
      color: colors.textMuted,
      userSelect: 'none',
    },
    square: (isLight, isHover) => ({
      width: 72,
      height: 72,
      backgroundColor: isLight ? colors.boardLight : colors.boardDark,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      position: 'relative',
      userSelect: 'none',
      transition: `background-color 120ms ease`,
    }),
    pieceSpan: {
      fontSize: 48,
      lineHeight: 1,
      pointerEvents: 'none',
      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
      transition: `transform 80ms ease`,
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Board Editor</h2>
      <div style={styles.layout}>
        {/* Board */}
        <div>
          <div style={styles.boardWrapper}>
            {ranks.map((rank, ri) => (
              <div key={rank} style={{ display: 'flex' }}>
                <div style={styles.rankLabel}>{rank}</div>
                {files.map((file, fi) => {
                  const rankIdx = RANKS.indexOf(rank);
                  const fileIdx = FILES.indexOf(file);
                  const index = rankIdx * 8 + fileIdx;
                  const isLight = (ri + fi) % 2 === 0;
                  const piece = board[index];
                  return (
                    <div
                      key={file + rank}
                      onClick={() => handleSquareClick(index)}
                      style={styles.square(isLight)}
                      title={`${file}${rank}`}
                    >
                      {piece && (
                        <ChessPiece type={piece[1]} color={piece[0]} size={54} />
                      )}
                      {!piece && selectedPiece && (
                        <div style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(0,0,0,0.08)',
                          transition: `opacity ${transitions.fast}`,
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            <div style={{ display: 'flex', marginLeft: 24, backgroundColor: colors.bgDeep }}>
              {files.map((file) => (
                <div key={file} style={styles.fileLabel}>{file}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={styles.sidebar}>
          {/* Piece Palette */}
          <div style={styles.sectionCard}>
            <span style={styles.sectionLabel}>Pieces</span>
            <div style={{ marginBottom: spacing.xs }}>
              <div style={{ ...typography.tiny, color: colors.textMuted, marginBottom: 4 }}>White</div>
              <div style={styles.paletteGrid}>
                {PIECE_TYPES.filter(p => p.key.startsWith('w')).map(p => (
                  <div
                    key={p.key}
                    onClick={() => handlePieceSelect(p.key)}
                    style={styles.paletteItem(selectedPiece === p.key)}
                    title={`White ${p.label}`}
                  >
                    <ChessPiece type={p.key[1]} color={p.key[0]} size={28} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ ...typography.tiny, color: colors.textMuted, marginBottom: 4 }}>Black</div>
              <div style={styles.paletteGrid}>
                {PIECE_TYPES.filter(p => p.key.startsWith('b')).map(p => (
                  <div
                    key={p.key}
                    onClick={() => handlePieceSelect(p.key)}
                    style={styles.paletteItem(selectedPiece === p.key)}
                    title={`Black ${p.label}`}
                  >
                    <ChessPiece type={p.key[1]} color={p.key[0]} size={28} />
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setSelectedPiece(null)}
              style={styles.eraserBtn(selectedPiece === null)}
            >
              Eraser (click to remove)
            </button>
          </div>

          {/* Side to Move */}
          <div style={styles.sectionCard}>
            <span style={styles.sectionLabel}>Side to Move</span>
            <div style={styles.turnRow}>
              <button
                onClick={() => handleTurnChange('w')}
                style={styles.turnButton(turn === 'w')}
              >
                White
              </button>
              <button
                onClick={() => handleTurnChange('b')}
                style={styles.turnButton(turn === 'b')}
              >
                Black
              </button>
            </div>
          </div>

          {/* Castling Rights */}
          <div style={styles.sectionCard}>
            <span style={styles.sectionLabel}>Castling Rights</span>
            <div style={styles.castlingRow}>
              {[
                { right: 'K', label: 'K' },
                { right: 'Q', label: 'Q' },
                { right: 'k', label: 'k' },
                { right: 'q', label: 'q' },
              ].map(({ right, label }) => (
                <label key={right} style={styles.castlingCheck} onClick={() => handleCastlingChange(right)}>
                  <div style={styles.checkbox(castling[right])}>
                    {castling[right] ? '\u2713' : ''}
                  </div>
                  <span style={styles.checkLabel}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* FEN Input/Output */}
          <div style={styles.sectionCard}>
            <span style={styles.sectionLabel}>FEN</span>
            <div style={styles.fenRow}>
              <input
                type="text"
                value={fenInput}
                onChange={handleFenInputChange}
                onKeyDown={handleFenKeyDown}
                style={styles.fenInput}
                spellCheck={false}
                placeholder="Paste FEN here..."
              />
              <button onClick={applyFen} style={styles.fenApplyBtn}>Apply</button>
            </div>
            {fenError && <div style={styles.fenError}>{fenError}</div>}
            <div style={styles.validationBadge(fenValidation.valid)}>
              {fenValidation.valid ? 'Valid position' : 'Invalid position'}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={styles.sectionCard}>
            <span style={styles.sectionLabel}>Quick Actions</span>
            <div style={styles.quickActions}>
              <button onClick={loadStarting} style={styles.smallBtn}>Starting Position</button>
              <button onClick={clearBoard} style={styles.smallBtn}>Clear Board</button>
            </div>
            <div style={{ ...styles.quickActions, marginTop: spacing.xs }}>
              <button onClick={() => setFlipped(f => !f)} style={styles.smallBtn}>
                {flipped ? 'Flip: Black POV' : 'Flip: White POV'}
              </button>
              <button
                onClick={copyFen}
                style={{
                  ...styles.smallBtn,
                  ...(copyFeedback ? { color: colors.success, borderColor: colors.success } : {}),
                }}
              >
                {copyFeedback ? 'Copied!' : 'Copy FEN'}
              </button>
            </div>
          </div>

          {/* Play from Position */}
          <button
            onClick={playFromPosition}
            disabled={!fenValidation.valid}
            style={fenValidation.valid ? styles.playButton : styles.playButtonDisabled}
          >
            Play from Position
          </button>
        </div>
      </div>
    </div>
  );
}
