import { PIECE_SYMBOLS } from '../constants';

export default function Square({ piece, isLight, isSelected, isLegalMove, isLastMove, onClick }) {
  const baseColor = isLight ? '#f0d9b5' : '#b58863';
  const selectedColor = isLight ? '#f7ec5a' : '#dac42a';
  const lastMoveColor = isLight ? '#cdd26a' : '#a9a238';

  let bg = baseColor;
  if (isSelected) bg = selectedColor;
  else if (isLastMove) bg = lastMoveColor;

  return (
    <div
      onClick={onClick}
      style={{
        width: 72,
        height: 72,
        backgroundColor: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {isLegalMove && !piece && (
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.15)',
          }}
        />
      )}
      {isLegalMove && piece && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '5px solid rgba(0,0,0,0.15)',
          }}
        />
      )}
      {piece && (
        <span style={{ fontSize: 48, lineHeight: 1, pointerEvents: 'none' }}>
          {PIECE_SYMBOLS[piece.color + piece.type]}
        </span>
      )}
    </div>
  );
}
