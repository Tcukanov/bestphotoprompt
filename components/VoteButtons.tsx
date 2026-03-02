'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

interface VoteButtonsProps {
  promptPostId: string;
  initialScore: number;
  initialUserVote: number;
  direction?: 'row' | 'col';
}

export function VoteButtons({
  promptPostId,
  initialScore,
  initialUserVote,
  direction = 'col',
}: VoteButtonsProps) {
  const { data: session } = useSession();
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [loading, setLoading] = useState(false);

  const handleVote = async (value: 1 | -1) => {
    if (!session) {
      toast.error('Sign in to vote');
      return;
    }
    if (loading) return;

    try {
      setLoading(true);
      const previousVote = userVote;

      if (userVote === value) {
        setUserVote(0);
        setScore(score - value);
        const response = await fetch(`/api/vote?promptPostId=${promptPostId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed');
        const data = await response.json();
        setScore(data.siteScore);
      } else {
        const scoreDiff = userVote === 0 ? value : value - previousVote;
        setUserVote(value);
        setScore(score + scoreDiff);
        const response = await fetch('/api/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ promptPostId, value }),
        });
        if (!response.ok) throw new Error('Failed');
        const data = await response.json();
        setScore(data.siteScore);
      }
    } catch {
      toast.error('Vote failed');
      setUserVote(initialUserVote);
      setScore(initialScore);
    } finally {
      setLoading(false);
    }
  };

  const isRow = direction === 'row';

  return (
    <div className={`flex items-center gap-1 ${isRow ? 'flex-row' : 'flex-col'}`}>
      <button
        onClick={() => handleVote(1)}
        disabled={loading}
        className={`p-1.5 rounded-lg transition-all ${
          userVote === 1
            ? 'text-[var(--accent)] bg-[var(--accent-soft)]'
            : 'text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)]'
        } disabled:opacity-40`}
        title="Upvote"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={userVote === 1 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>

      <span className={`text-sm font-bold tabular-nums min-w-[20px] text-center ${
        score > 0 ? 'text-[var(--success)]' : score < 0 ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'
      }`}>
        {score}
      </span>

      <button
        onClick={() => handleVote(-1)}
        disabled={loading}
        className={`p-1.5 rounded-lg transition-all ${
          userVote === -1
            ? 'text-[var(--danger)] bg-red-500/10'
            : 'text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-500/10'
        } disabled:opacity-40`}
        title="Downvote"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={userVote === -1 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}
