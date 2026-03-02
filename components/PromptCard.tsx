'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PromptPostWithVotes } from '@/lib/types';
import { formatNumber, formatDate, truncateText } from '@/lib/utils';
import { CopyButton } from './CopyButton';
import { VoteButtons } from './VoteButtons';

interface PromptCardProps {
  prompt: PromptPostWithVotes;
}

function getSourceInfo(url: string): { label: string; icon: string; color: string } {
  if (url.includes('reddit.com')) {
    return { label: 'Reddit', icon: 'R', color: 'text-orange-400' };
  }
  if (url.includes('threads.net')) {
    return { label: 'Threads', icon: 'T', color: 'text-purple-400' };
  }
  return { label: 'X', icon: 'X', color: 'text-blue-400' };
}

/** Proxy Instagram CDN images through our server to bypass hotlink protection */
function resolveImageUrl(imageUrl: string): string {
  if (
    imageUrl.includes('cdninstagram.com') ||
    imageUrl.includes('fbcdn.net')
  ) {
    return `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
  }
  return imageUrl;
}

export function PromptCard({ prompt }: PromptCardProps) {
  const [imgError, setImgError] = useState(false);
  const source = getSourceInfo(prompt.tweetUrl);
  const hasImage = prompt.imageUrl && !imgError;

  return (
    <div className="card group overflow-hidden flex flex-col">
      {/* Image */}
      <Link href={`/p/${prompt.id}`} className="block relative">
        {hasImage ? (
          <div className="relative aspect-[4/3] overflow-hidden bg-[var(--bg-secondary)]">
            <img
              src={resolveImageUrl(prompt.imageUrl!)}
              alt=""
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={() => setImgError(true)}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ) : (
          <div className="aspect-[4/3] bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-elevated)] flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-30">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {prompt.model !== 'UNKNOWN' && (
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide bg-black/70 backdrop-blur text-white rounded-full">
              {prompt.model.replace('_', ' ')}
            </span>
          )}
        </div>

        {prompt.aspectRatio && (
          <span className="absolute top-3 right-3 px-2 py-1 text-[11px] font-medium bg-black/70 backdrop-blur text-white/80 rounded-full">
            {prompt.aspectRatio}
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 gap-3">
        {/* Author + Source */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              source.label === 'Reddit'
                ? 'bg-orange-500/20 text-orange-400'
                : source.label === 'Threads'
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              {source.icon}
            </div>
            <span className="text-sm text-[var(--text-secondary)] truncate">
              {prompt.authorHandle}
            </span>
          </div>
          <span className="text-xs text-[var(--text-muted)] shrink-0">
            {formatDate(prompt.createdAtX)}
          </span>
        </div>

        {/* Prompt text */}
        <Link href={`/p/${prompt.id}`} className="block">
          <p className="text-[13px] leading-relaxed text-[var(--text-secondary)] line-clamp-3 group-hover:text-[var(--text-primary)] transition-colors">
            {truncateText(prompt.promptText, 180)}
          </p>
        </Link>

        {/* Tags */}
        {prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {prompt.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)] bg-[var(--bg-secondary)] rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-1">
            <VoteButtons
              promptPostId={prompt.id}
              initialScore={prompt.siteScore || 0}
              initialUserVote={prompt.userVote?.value || 0}
              direction="row"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 text-[11px] text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                {formatNumber(prompt.likeCount)}
              </span>
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                {formatNumber(prompt.replyCount)}
              </span>
            </div>
            <CopyButton text={prompt.promptText} />
          </div>
        </div>
      </div>
    </div>
  );
}
