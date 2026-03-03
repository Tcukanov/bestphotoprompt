import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  discoverAccounts,
  fetchThreadsUserPosts,
  isGeminiPhotoPrompt,
  extractThreadsPrompt,
  isSubstantivePrompt,
  detectThreadsModel,
  extractThreadsTags,
  extractThreadsAspectRatio,
  calculateThreadsScore,
} from '@/lib/threads-api';
import { AIModel, PromptStatus } from '@prisma/client';

const BATCH_SIZE = 5;      // accounts processed in parallel
const TOP_POSTS = 8;       // most viral posts to keep per account
const MAX_ACCOUNTS = 30;   // total account pool size

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  if (authHeader === `Bearer ${cronSecret}`) return true;
  const secret = request.nextUrl.searchParams.get('secret');
  return secret === cronSecret;
}

interface AccountResult {
  username: string;
  processed: number;
  saved: number;
  skippedNoImage: number;
  skippedNoPrompt: number;
  skippedDuplicate: number;
  errors: string[];
}

async function processAccount(username: string): Promise<AccountResult> {
  const result: AccountResult = {
    username,
    processed: 0,
    saved: 0,
    skippedNoImage: 0,
    skippedNoPrompt: 0,
    skippedDuplicate: 0,
    errors: [],
  };

  try {
    const posts = await fetchThreadsUserPosts(username, TOP_POSTS);
    if (!posts.length) return result;

    console.log(`[Threads] @${username}: ${posts.length} top posts`);

    for (const post of posts) {
      result.processed++;
      try {
        if (!post.imageUrl) { result.skippedNoImage++; continue; }
        if (!isGeminiPhotoPrompt(post.text)) { result.skippedNoPrompt++; continue; }

        const sourceId = `threads_${post.id}`;
        const existing = await prisma.promptPost.findUnique({ where: { tweetId: sourceId } });
        if (existing) { result.skippedDuplicate++; continue; }

        const promptText = extractThreadsPrompt(post.text);
        if (!promptText || !isSubstantivePrompt(promptText)) { result.skippedNoPrompt++; continue; }

        const model = detectThreadsModel(post.text);
        const tags = extractThreadsTags(post.text);
        const aspectRatio = extractThreadsAspectRatio(post.text);
        const viralScore = calculateThreadsScore(post.likeCount, post.replyCount);

        await prisma.promptPost.create({
          data: {
            tweetId: sourceId,
            tweetUrl: post.postUrl,
            authorHandle: `@${post.username}`,
            authorName: post.authorName || post.username,
            createdAtX: post.createdAt,
            rawText: post.text,
            promptText,
            imageUrl: post.imageUrl,
            imageUrls: post.imageUrls,
            embedHtml: null,
            likeCount: post.likeCount,
            repostCount: 0,
            replyCount: post.replyCount,
            quoteCount: 0,
            viralScore,
            tags,
            model: model as AIModel,
            aspectRatio,
            status: PromptStatus.PUBLISHED,
          },
        });

        result.saved++;
        console.log(`[Threads] +${post.likeCount}❤️ @${post.username}: "${post.text.slice(0, 60)}..."`);
      } catch (err) {
        result.errors.push(`${post.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : String(err));
    console.error(`[Threads] @${username} failed:`, err);
  }

  return result;
}

export async function GET(request: NextRequest) {
  console.log('[Threads] Starting ingestion...');

  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Discover up to 30 accounts (seeds + auto-discovered)
  console.log('[Threads] Discovering accounts...');
  const accounts = await discoverAccounts(MAX_ACCOUNTS);
  console.log(`[Threads] Account pool: ${accounts.length} accounts`);

  const allResults: AccountResult[] = [];

  // Process in parallel batches of 5
  for (let i = 0; i < accounts.length; i += BATCH_SIZE) {
    const batch = accounts.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(batch.map(processAccount));

    for (const r of batchResults) {
      if (r.status === 'fulfilled') allResults.push(r.value);
      else console.error('[Threads] Batch account error:', r.reason);
    }

    // Polite pause between batches (not between every account)
    if (i + BATCH_SIZE < accounts.length) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  const totals = allResults.reduce(
    (acc, r) => ({
      processed: acc.processed + r.processed,
      saved: acc.saved + r.saved,
      noImage: acc.noImage + r.skippedNoImage,
      noPrompt: acc.noPrompt + r.skippedNoPrompt,
      duplicate: acc.duplicate + r.skippedDuplicate,
    }),
    { processed: 0, saved: 0, noImage: 0, noPrompt: 0, duplicate: 0 }
  );

  const allErrors = allResults.flatMap((r) => r.errors).slice(0, 10);

  const summary = {
    success: true,
    source: 'threads',
    accounts: accounts.length,
    topPostsPerAccount: TOP_POSTS,
    ...totals,
    errors: allErrors.length > 0 ? allErrors : undefined,
    timestamp: new Date().toISOString(),
  };

  console.log('[Threads] Complete:', JSON.stringify(summary, null, 2));
  return NextResponse.json(summary);
}

export const dynamic = 'force-dynamic';
