import { FILES, RANKS } from '../constants';
import Square from './Square';

export default function Board({ game, selectedSquare, legalMoves, lastMove, onSquareClick, flipped }) {
  const ranks = flipped ? [...RANKS].reverse() : RANKS;
  const files = flipped ? [...FILES].reverse() : FILES;

  return (
    <div style={{ display: 'inline-block', border: '2px solid #333' }}>
      {ranks.map((rank, ri) => (
        <div key={rank} style={{ display: 'flex' }}>
          <div
            style={{
              width: 24,
              height: 72,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 'bold',
              color: '#555',
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
            return (
              <Square
                key={sq}
                piece={piece}
                isLight={isLight}
                isSelected={isSelected}
                isLegalMove={isLegalMove}
                isLastMove={isLastMove}
                onClick={() => onSquareClick(sq)}
              />
            );
          })}
        </div>
      ))}
      <div style={{ display: 'flex', marginLeft: 24 }}>
        {files.map((file) => (
          <div
            key={file}
            style={{
              width: 72,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 'bold',
              color: '#555',
            }}
          >
            {file}
          </div>
        ))}
      </div>
    </div>
  );
}
