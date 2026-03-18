import { PIECE_SYMBOLS } from '../constants';

export default function PromotionModal({ color, onSelect }) {
  const pieces = ['q', 'r', 'b', 'n'];
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 24,
          display: 'flex',
          gap: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <p style={{ width: '100%', textAlign: 'center', margin: '0 0 8px', fontWeight: 'bold' }}>
          Promote to:
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          {pieces.map((p) => (
            <button
              key={p}
              onClick={() => onSelect(p)}
              style={{
                fontSize: 48,
                width: 64,
                height: 64,
                border: '2px solid #ccc',
                borderRadius: 8,
                backgroundColor: '#f5f5f5',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {PIECE_SYMBOLS[color + p]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
