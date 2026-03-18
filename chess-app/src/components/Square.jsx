import ChessPiece from './ChessPiece';

const DEFAULT_COLORS = {
  light: '#f0d9b5',
  dark: '#b58863',
  selectedLight: '#f7f769',
  selectedDark: '#bbcc44',
  lastMoveLight: '#ced26b',
  lastMoveDark: '#aaa23a',
};

const PREMOVE_LIGHT = '#ab7bdf';
const PREMOVE_DARK = '#8f54cc';
const LEGAL_MOVE = 'rgba(0,0,0,0.15)';

export default function Square({
  piece,
  isLight,
  isSelected,
  isLegalMove,
  isLastMove,
  isPremove,
  isPremoveSelection,
  onClick,
  onRightClick,
  onDragStart,
  onDragOver,
  onDrop,
  squareSize = 72,
  themeColors,
}) {
  const c = themeColors || DEFAULT_COLORS;
  const baseColor = isLight ? c.light : c.dark;
  const selectedColor = isLight ? c.selectedLight : c.selectedDark;
  const lastMoveColor = isLight ? c.lastMoveLight : c.lastMoveDark;
  const premoveColor = isLight ? PREMOVE_LIGHT : PREMOVE_DARK;

  let bg = baseColor;
  if (isPremoveSelection) bg = isLight ? '#cf9fff' : '#a855f7';
  else if (isPremove) bg = premoveColor;
  else if (isSelected) bg = selectedColor;
  else if (isLastMove) bg = lastMoveColor;

  const pieceSize = Math.round(squareSize * 0.85);

  return (
    <div
      className="board-square"
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        if (onRightClick) onRightClick(e);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (onDragOver) onDragOver(e);
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (onDrop) onDrop(e);
      }}
      style={{
        width: squareSize,
        height: squareSize,
        backgroundColor: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: piece ? 'grab' : isLegalMove ? 'pointer' : 'default',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {isLegalMove && !piece && (
        <div style={{
          width: squareSize * 0.28,
          height: squareSize * 0.28,
          borderRadius: '50%',
          backgroundColor: LEGAL_MOVE,
        }} />
      )}
      {isLegalMove && piece && (
        <div style={{
          position: 'absolute',
          inset: 2,
          borderRadius: '50%',
          border: `${Math.max(3, squareSize * 0.06)}px solid ${LEGAL_MOVE}`,
          pointerEvents: 'none',
        }} />
      )}
      {piece && (
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move';
            const ghost = e.currentTarget.cloneNode(true);
            ghost.style.opacity = '0.8';
            ghost.style.position = 'absolute';
            ghost.style.top = '-1000px';
            document.body.appendChild(ghost);
            e.dataTransfer.setDragImage(ghost, pieceSize / 2, pieceSize / 2);
            setTimeout(() => document.body.removeChild(ghost), 0);
            if (onDragStart) onDragStart(e);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'grab',
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))',
            opacity: isPremove && !isPremoveSelection ? 0.7 : 1,
          }}
        >
          <ChessPiece type={piece.type} color={piece.color} size={pieceSize} />
        </div>
      )}
    </div>
  );
}
