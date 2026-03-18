import { useState, useEffect, useMemo, useCallback } from 'react';
import { getDailyChallenges } from '../data/challenges';
import Badge from '../components/common/Badge';
import { getItem, setItem } from '../utils/storage';
import { colors, commonStyles, spacing, borderRadius, shadows, transitions } from '../theme';

const STORAGE_KEY = 'chess_daily_challenges';

function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getMillisUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight - now;
}

function formatCountdown(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

export default function DailyChallenges() {
  const [timeLeft, setTimeLeft] = useState(getMillisUntilMidnight());

  const todayStr = getTodayString();
  const challenges = useMemo(() => getDailyChallenges(new Date()), [todayStr]);

  const stored = getItem(STORAGE_KEY, { date: '', completed: [] });
  const completed = stored.date === todayStr ? stored.completed : [];

  const markComplete = useCallback((challengeId) => {
    const current = getItem(STORAGE_KEY, { date: '', completed: [] });
    const currentCompleted = current.date === todayStr ? current.completed : [];
    if (!currentCompleted.includes(challengeId)) {
      setItem(STORAGE_KEY, { date: todayStr, completed: [...currentCompleted, challengeId] });
    }
  }, [todayStr]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getMillisUntilMidnight());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalReward = challenges.reduce((sum, c) => {
    return completed.includes(c.id) ? sum + c.reward : sum;
  }, 0);

  const maxReward = challenges.reduce((sum, c) => sum + c.reward, 0);

  return (
    <div style={commonStyles.page}>
      {/* Header */}
      <div style={{ marginBottom: spacing.xl, animation: 'fadeIn 400ms ease' }}>
        <h1 style={{
          color: colors.text,
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          margin: 0,
          marginBottom: spacing.xs,
        }}>
          Daily Challenges
        </h1>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
          flexWrap: 'wrap',
        }}>
          <span style={{ color: colors.textSecondary, fontSize: 15 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
          <Badge
            text={`Resets in ${formatCountdown(timeLeft)}`}
            color={colors.warning}
            style={{ fontSize: 12 }}
          />
        </div>
      </div>

      {/* Reward Summary */}
      <div style={{
        ...commonStyles.card,
        marginBottom: spacing.lg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: `linear-gradient(135deg, ${colors.bgCard} 0%, ${colors.bgDeep} 100%)`,
        animation: 'fadeIn 400ms ease 50ms both',
      }}>
        <div>
          <div style={{ color: colors.textSecondary, fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>
            Earned Today
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: spacing.xs }}>
            <span style={{ color: colors.accent, fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em' }}>
              +{totalReward}
            </span>
            <span style={{ color: colors.textMuted, fontSize: 14 }}>
              / {maxReward} ELO bonus
            </span>
          </div>
        </div>
        <div style={{
          display: 'flex',
          gap: spacing.xs,
        }}>
          {challenges.map((c) => (
            <div
              key={c.id}
              style={{
                width: 12,
                height: 12,
                borderRadius: borderRadius.full,
                backgroundColor: completed.includes(c.id) ? colors.success : colors.borderLight,
                transition: `background-color ${transitions.base}`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Challenge Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        {challenges.map((challenge, index) => {
          const isComplete = completed.includes(challenge.id);
          return (
            <div
              key={challenge.id}
              style={{
                ...commonStyles.card,
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.lg,
                borderColor: isComplete ? colors.success : colors.border,
                boxShadow: isComplete ? `0 0 0 1px ${colors.success}40, ${shadows.sm}` : shadows.sm,
                animation: `fadeInUp 400ms ease ${100 + index * 80}ms both`,
                opacity: isComplete ? 0.85 : 1,
              }}
            >
              {/* Icon */}
              <div style={{
                width: 56,
                height: 56,
                borderRadius: borderRadius.lg,
                backgroundColor: isComplete ? `${colors.success}18` : colors.bgDeep,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                flexShrink: 0,
                transition: `background-color ${transitions.base}`,
              }}>
                {challenge.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  marginBottom: 4,
                }}>
                  <span style={{
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                  }}>
                    {challenge.name}
                  </span>
                  {isComplete && (
                    <Badge text="Completed" color={colors.success} />
                  )}
                </div>
                <p style={{
                  color: colors.textSecondary,
                  fontSize: 14,
                  margin: 0,
                  lineHeight: 1.5,
                }}>
                  {challenge.description}
                </p>
              </div>

              {/* Reward */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                flexShrink: 0,
              }}>
                <span style={{
                  color: isComplete ? colors.success : colors.accent,
                  fontSize: 18,
                  fontWeight: 800,
                }}>
                  +{challenge.reward}
                </span>
                <span style={{
                  color: colors.textDark,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}>
                  ELO bonus
                </span>
              </div>

              {/* Checkmark overlay for completed */}
              {isComplete && (
                <div style={{
                  position: 'absolute',
                  top: spacing.sm,
                  right: spacing.sm,
                  width: 24,
                  height: 24,
                  borderRadius: borderRadius.full,
                  backgroundColor: colors.success,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.white,
                  fontSize: 14,
                  fontWeight: 700,
                  boxShadow: shadows.sm,
                }}>
                  \u2713
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
