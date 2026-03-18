import { useState, useMemo } from 'react';
import Badge from '../components/common/Badge';
import { getItem } from '../utils/storage';
import { formatDate } from '../utils/formatters';
import { colors, commonStyles, spacing, shadows, transitions } from '../theme';

const CATEGORY_COLORS = {
  Championship: '#ef4444',
  Analysis: '#60a5fa',
  Tutorial: '#7cb342',
  Platform: '#a78bfa',
  Strategy: '#f59e0b',
  Puzzles: '#fbbf24',
  Players: '#34d399',
};

export default function News() {
  const articles = useMemo(() => getItem('chess_news', []), []);
  const [selected, setSelected] = useState(null);

  const article = selected ? articles.find((a) => a.id === selected) : null;

  if (article) {
    return (
      <div style={commonStyles.page}>
        <button onClick={() => setSelected(null)} style={{
          ...commonStyles.buttonSecondary, marginBottom: spacing.md, fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 16 }}>&larr;</span> Back to news
        </button>
        <div style={{ ...commonStyles.card, animation: 'fadeIn 300ms ease' }}>
          <Badge text={article.category} color={CATEGORY_COLORS[article.category] || colors.accent} style={{ marginBottom: spacing.md }} />
          <h1 style={{ color: colors.text, marginTop: spacing.sm, marginBottom: spacing.sm, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{article.title}</h1>
          <div style={{ color: colors.textDark, fontSize: 13, marginBottom: spacing.lg }}>
            By {article.author} &middot; {formatDate(article.date)}
          </div>
          <p style={{ color: colors.textSecondary, lineHeight: 1.8, fontSize: 16 }}>{article.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={commonStyles.page}>
      <h1 style={{ color: colors.text, marginBottom: spacing.lg, fontWeight: 800, letterSpacing: '-0.02em' }}>Chess News</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: spacing.lg }}>
        {articles.map((article, i) => (
          <div
            key={article.id}
            onClick={() => setSelected(article.id)}
            style={{
              ...commonStyles.cardHoverable,
              animation: `fadeInUp 400ms ease ${i * 80}ms both`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = CATEGORY_COLORS[article.category] || colors.accent;
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = shadows.md;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.border;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
              <Badge text={article.category} color={CATEGORY_COLORS[article.category] || colors.accent} />
              <span style={{ color: colors.textDark, fontSize: 12 }}>{formatDate(article.date)}</span>
            </div>
            <h3 style={{ color: colors.text, margin: `${spacing.sm}px 0`, lineHeight: 1.3, fontWeight: 600 }}>{article.title}</h3>
            <p style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{article.excerpt}</p>
            <div style={{ color: colors.textDark, fontSize: 12, marginTop: spacing.md }}>By {article.author}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
