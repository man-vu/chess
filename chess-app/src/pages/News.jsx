import { useState, useMemo } from 'react';
import Badge from '../components/common/Badge';
import { getItem } from '../utils/storage';
import { formatDate } from '../utils/formatters';
import { colors, commonStyles, spacing, borderRadius } from '../theme';

const CATEGORY_COLORS = {
  Championship: '#e74c3c',
  Analysis: '#3498db',
  Tutorial: '#2ecc71',
  Platform: '#9b59b6',
  Strategy: '#e67e22',
  Puzzles: '#f1c40f',
  Players: '#1abc9c',
};

export default function News() {
  const articles = useMemo(() => getItem('chess_news', []), []);
  const [selected, setSelected] = useState(null);

  const article = selected ? articles.find((a) => a.id === selected) : null;

  if (article) {
    return (
      <div style={commonStyles.page}>
        <button onClick={() => setSelected(null)} style={{ ...commonStyles.buttonSecondary, marginBottom: spacing.md, fontSize: 13 }}>
          {'<'} Back to news
        </button>
        <div style={commonStyles.card}>
          <Badge text={article.category} color={CATEGORY_COLORS[article.category] || colors.accent} style={{ marginBottom: spacing.md }} />
          <h1 style={{ color: colors.text, marginTop: spacing.sm, marginBottom: spacing.sm }}>{article.title}</h1>
          <div style={{ color: colors.textMuted, fontSize: 13, marginBottom: spacing.lg }}>
            By {article.author} &middot; {formatDate(article.date)}
          </div>
          <p style={{ color: colors.textSecondary, lineHeight: 1.8, fontSize: 16 }}>{article.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={commonStyles.page}>
      <h1 style={{ color: colors.text, marginBottom: spacing.lg }}>Chess News</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350, 1fr))', gap: spacing.lg }}>
        {articles.map((article) => (
          <div
            key={article.id}
            onClick={() => setSelected(article.id)}
            style={{ ...commonStyles.card, cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
              <Badge text={article.category} color={CATEGORY_COLORS[article.category] || colors.accent} />
              <span style={{ color: colors.textMuted, fontSize: 12 }}>{formatDate(article.date)}</span>
            </div>
            <h3 style={{ color: colors.text, margin: `${spacing.sm}px 0`, lineHeight: 1.3 }}>{article.title}</h3>
            <p style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 1.5, margin: 0 }}>{article.excerpt}</p>
            <div style={{ color: colors.textMuted, fontSize: 12, marginTop: spacing.sm }}>By {article.author}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
