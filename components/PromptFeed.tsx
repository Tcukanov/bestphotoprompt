'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PromptListResponse } from '@/lib/types';
import { PromptCard } from './PromptCard';
import { Pagination } from './Pagination';

function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-[4/3] skeleton" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full skeleton" />
          <div className="h-3 w-20 skeleton" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full skeleton" />
          <div className="h-3 w-4/5 skeleton" />
          <div className="h-3 w-3/5 skeleton" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-5 w-14 skeleton rounded-full" />
          <div className="h-5 w-12 skeleton rounded-full" />
        </div>
        <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
          <div className="h-6 w-20 skeleton" />
          <div className="h-6 w-16 skeleton" />
        </div>
      </div>
    </div>
  );
}

export function PromptFeed() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<PromptListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrompts() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams(searchParams.toString());
        const response = await fetch(`/api/prompts?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch prompts');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load prompts');
      } finally {
        setLoading(false);
      }
    }

    fetchPrompts();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-10 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="text-[var(--text-secondary)] mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (!data || data.prompts.length === 0) {
    return (
      <div className="card p-16 text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">No prompts yet</h3>
        <p className="text-[var(--text-muted)] max-w-sm mx-auto">
          Try a different filter or check back later. New prompts are fetched from Reddit daily.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {data.prompts.map((prompt) => (
          <PromptCard key={prompt.id} prompt={prompt} />
        ))}
      </div>

      <Pagination
        currentPage={data.page}
        totalPages={data.totalPages}
        total={data.total}
      />
    </div>
  );
}
