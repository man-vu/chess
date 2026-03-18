export default function MoveHistory({ history }) {
  const pairs = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({
      num: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1] || '',
    });
  }

  return (
    <div
      style={{
        width: 220,
        maxHeight: 576,
        overflowY: 'auto',
        backgroundColor: '#1e1e1e',
        color: '#ddd',
        borderRadius: 8,
        padding: '8px 0',
        fontFamily: 'monospace',
        fontSize: 14,
      }}
    >
      <div style={{ padding: '0 12px 8px', fontWeight: 'bold', borderBottom: '1px solid #333' }}>
        Moves
      </div>
      {pairs.map((p) => (
        <div
          key={p.num}
          style={{
            display: 'flex',
            padding: '3px 12px',
            backgroundColor: p.num % 2 === 0 ? '#252525' : 'transparent',
          }}
        >
          <span style={{ width: 32, color: '#888' }}>{p.num}.</span>
          <span style={{ width: 80 }}>{p.white}</span>
          <span style={{ width: 80 }}>{p.black}</span>
        </div>
      ))}
      {pairs.length === 0 && (
        <div style={{ padding: '12px', color: '#666', textAlign: 'center' }}>No moves yet</div>
      )}
    </div>
  );
}
