import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { formatNumber, formatDate } from '@/lib/utils';
import { CopyButton } from '@/components/CopyButton';
import { VoteButtons } from '@/components/VoteButtons';
import { TweetEmbed } from '@/components/TweetEmbed';
import { ImageGallery } from '@/components/ImageGallery';

interface PromptPageProps {
  params: { id: string };
}

function getSourceInfo(url: string) {
  if (url.includes('reddit.com')) return { label: 'Reddit', color: 'text-orange-400', bg: 'bg-orange-500/10' };
  if (url.includes('threads.net')) return { label: 'Threads', color: 'text-purple-400', bg: 'bg-purple-500/10' };
  return { label: 'X (Twitter)', color: 'text-blue-400', bg: 'bg-blue-500/10' };
}

function resolveImageUrl(url: string): string {
  if (url.includes('cdninstagram.com') || url.includes('fbcdn.net')) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export default async function PromptPage({ params }: PromptPageProps) {
  const session = await getServerSession(authOptions);

  const prompt = await prisma.promptPost.findUnique({
    where: { id: params.id },
    include: {
      votes: session?.user?.id ? { where: { userId: session.user.id } } : false,
    },
  });

  if (!prompt || prompt.status !== 'PUBLISHED') notFound();

  const voteSum = await prisma.vote.aggregate({
    where: { promptPostId: params.id },
    _sum: { value: true },
  });

  const siteScore = voteSum._sum.value || 0;
  const userVote = Array.isArray(prompt.votes) && prompt.votes.length > 0 ? prompt.votes[0].value : 0;
  const source = getSourceInfo(prompt.tweetUrl);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to feed
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Image(s) */}
        <div className="lg:col-span-3">
          <div className="card overflow-hidden">
            {(() => {
              // Collect all available images, proxying Instagram CDN ones
              const allUrls = prompt.imageUrls?.length
                ? prompt.imageUrls.map(resolveImageUrl)
                : prompt.imageUrl
                ? [resolveImageUrl(prompt.imageUrl)]
                : [];

              if (allUrls.length > 0) {
                return <ImageGallery images={allUrls} />;
              }
              return (
                <div className="aspect-[4/3] bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-elevated)] flex items-center justify-center">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" className="opacity-20">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              );
            })()}

            {/* oEmbed */}
            {prompt.embedHtml && (
              <div className="p-6 border-t border-[var(--border)]">
                <TweetEmbed html={prompt.embedHtml} />
              </div>
            )}
          </div>
        </div>

        {/* Right: Info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Author */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${source.bg} ${source.color}`}>
                  {prompt.authorHandle.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold">{prompt.authorName || prompt.authorHandle}</p>
                  <p className="text-xs text-[var(--text-muted)]">{formatDate(prompt.createdAtX)} via {source.label}</p>
                </div>
              </div>
              <VoteButtons
                promptPostId={prompt.id}
                initialScore={siteScore}
                initialUserVote={userVote}
              />
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {prompt.model !== 'UNKNOWN' && (
                <span className="pill pill-active text-xs">
                  {prompt.model.replace('_', ' ')}
                </span>
              )}
              {prompt.aspectRatio && (
                <span className="pill text-xs">{prompt.aspectRatio}</span>
              )}
              {prompt.tags.map((tag) => (
                <span key={tag} className="pill text-xs">{tag}</span>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">Prompt</h2>
              <CopyButton text={prompt.promptText} size="md" />
            </div>
            <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-[var(--text-primary)]">
                {prompt.promptText}
              </pre>
            </div>
          </div>

          {/* Stats */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--bg-secondary)] rounded-xl p-3 text-center">
                <div className="text-xl font-bold">{formatNumber(prompt.likeCount)}</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">Likes</div>
              </div>
              <div className="bg-[var(--bg-secondary)] rounded-xl p-3 text-center">
                <div className="text-xl font-bold">{formatNumber(prompt.replyCount)}</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">Comments</div>
              </div>
              <div className="bg-[var(--bg-secondary)] rounded-xl p-3 text-center">
                <div className="text-xl font-bold">{formatNumber(Math.round(prompt.viralScore))}</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">Viral Score</div>
              </div>
              <div className="bg-[var(--bg-secondary)] rounded-xl p-3 text-center">
                <div className={`text-xl font-bold ${siteScore > 0 ? 'text-[var(--success)]' : siteScore < 0 ? 'text-[var(--danger)]' : ''}`}>
                  {siteScore > 0 ? '+' : ''}{formatNumber(siteScore)}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">Site Score</div>
              </div>
            </div>
          </div>

          {/* Source */}
          <a
            href={prompt.tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="card p-4 flex items-center justify-between group hover:border-[var(--accent)]"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${source.bg} ${source.color}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </div>
              <span className="text-sm font-medium">View on {source.label}</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
