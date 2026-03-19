import { useCallback, useState, useEffect, useRef } from 'react';
import { FILES, RANKS } from '../constants';
import Square from './Square';

const LABEL_BG = '#262421';
const LABEL_COLOR = '#9e9e9e';
const DEFAULT_SQUARE_SIZE = 72;
const PREMOVE_ARROW_COLOR = 'rgba(168, 85, 247, 0.65)';

function useResponsiveSquareSize(containerRef, maxSize = DEFAULT_SQUARE_SIZE) {
  const [size, setSize] = useState(maxSize);
  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      // Reserve 22px for rank labels, 32px for page padding each side
      const available = Math.min(vw - 22 - 32, maxSize * 8);
      setSize(Math.max(32, Math.min(maxSize, Math.floor(available / 8))));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [maxSize]);
  return size;
}

/**
 * Convert algebraic square (e.g. "e4") to pixel center coords on the board.
 * Takes flipped into account.
 */
function squareToPixel(sq, flipped) {
  const fileIdx = FILES.indexOf(sq[0]);
  const rankIdx = RANKS.indexOf(sq[1]);
  const col = flipped ? 7 - fileIdx : fileIdx;
  const row = flipped ? 7 - rankIdx : rankIdx;
  return {
    x: col * SQUARE_SIZE + SQUARE_SIZE / 2,
    y: row * SQUARE_SIZE + SQUARE_SIZE / 2,
  };
}

export default function Board({
  game,
  selectedSquare,
  legalMoves,
  lastMove,
  onSquareClick,
  onDragMove,
  onRightClick,
  flipped,
  premoveSquares,
  premoveSelection,
  premoves,
  themeColors,
  moveEvals, // Map<square, { display, color }> for showing eval on legal move squares
}) {
  const boardRef = useRef(null);
  const SQUARE_SIZE = useResponsiveSquareSize(boardRef);
  const ranks = flipped ? [...RANKS].reverse() : RANKS;
  const files = flipped ? [...FILES].reverse() : FILES;
  const pmSquares = premoveSquares || new Set();
  const pmList = premoves || [];
  const evals = moveEvals || null;

  const handleDragStart = useCallback((sq) => (e) => {
    e.dataTransfer.setData('text/plain', sq);
    onSquareClick(sq);
  }, [onSquareClick]);

  const handleDrop = useCallback((sq) => (e) => {
    const from = e.dataTransfer.getData('text/plain');
    if (from && from !== sq && onDragMove) {
      onDragMove(from, sq);
    }
  }, [onDragMove]);

  const boardWidth = SQUARE_SIZE * 8;
  const boardHeight = SQUARE_SIZE * 8;

  return (
    <div ref={boardRef} style={{
      display: 'inline-block',
      borderRadius: 4,
      overflow: 'hidden',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.3)',
    }}>
      <div style={{ position: 'relative' }}>
        <div>
          {ranks.map((rank, ri) => (
            <div key={rank} style={{ display: 'flex' }}>
              <div
                className="board-label"
                style={{
                  width: 22,
                  height: SQUARE_SIZE,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: LABEL_COLOR,
                  backgroundColor: LABEL_BG,
                  userSelect: 'none',
                }}
              >
                {rank}
              </div>
              {files.map((file, fi) => {
                const sq = file + rank;
                const piece = game.get(sq);
                const isLight = (ri + fi) % 2 === 0;
                const isSelected = selectedSquare === sq;
                const isLegalMove = legalMoves.includes(sq);
                const isLastMove = lastMove && (lastMove.from === sq || lastMove.to === sq);
                const isPremove = pmSquares.has(sq);
                const isPremoveSelection = premoveSelection === sq;
                return (
                  <Square
                    key={sq}
                    piece={piece}
                    isLight={isLight}
                    isSelected={isSelected}
                    isLegalMove={isLegalMove}
                    isLastMove={isLastMove}
                    isPremove={isPremove}
                    isPremoveSelection={isPremoveSelection}
                    squareSize={SQUARE_SIZE}
                    onClick={() => onSquareClick(sq)}
                    onRightClick={onRightClick}
                    onDragStart={handleDragStart(sq)}
                    onDrop={handleDrop(sq)}
                    themeColors={themeColors}
                    moveEval={isLegalMove && evals ? evals.get(sq) || null : null}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Premove arrows SVG overlay */}
        {pmList.length > 0 && (
          <svg
            width={boardWidth}
            height={boardHeight}
            style={{
              position: 'absolute',
              top: 0,
              left: 22, // offset for rank labels
              pointerEvents: 'none',
              zIndex: 5,
            }}
          >
            <defs>
              <marker
                id="premove-arrow"
                markerWidth="4"
                markerHeight="4"
                refX="2.5"
                refY="2"
                orient="auto"
              >
                <path d="M0,0 L4,2 L0,4 Z" fill={PREMOVE_ARROW_COLOR} />
              </marker>
            </defs>
            {pmList.map((pm, i) => {
              const from = squareToPixel(pm.from, flipped);
              const to = squareToPixel(pm.to, flipped);
              // Shorten line so arrow doesn't overlap piece center
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const shorten = 14;
              const endX = to.x - (dx / len) * shorten;
              const endY = to.y - (dy / len) * shorten;
              return (
                <line
                  key={`${pm.from}-${pm.to}-${i}`}
                  x1={from.x}
                  y1={from.y}
                  x2={endX}
                  y2={endY}
                  stroke={PREMOVE_ARROW_COLOR}
                  strokeWidth={10}
                  strokeLinecap="round"
                  markerEnd="url(#premove-arrow)"
                  opacity={0.85}
                />
              );
            })}
          </svg>
        )}
      </div>
      <div style={{ display: 'flex', marginLeft: 22, backgroundColor: LABEL_BG }}>
        {files.map((file) => (
          <div
            key={file}
            className="board-file-label"
            style={{
              width: SQUARE_SIZE,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: LABEL_COLOR,
              userSelect: 'none',
            }}
          >
            {file}
          </div>
        ))}
      </div>
    </div>
  );
}
