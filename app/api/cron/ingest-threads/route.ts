import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  fetchThreadsUserPosts,
  isGeminiPhotoPrompt,
  extractThreadsPrompt,
  detectThreadsModel,
  extractThreadsTags,
  extractThreadsAspectRatio,
  calculateThreadsScore,
  THREADS_PROMPT_ACCOUNTS,
} from '@/lib/threads-api';
import { AIModel, PromptStatus } from '@prisma/client';

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  if (authHeader === `Bearer ${cronSecret}`) return true;
  const secret = request.nextUrl.searchParams.get('secret');
  return secret === cronSecret;
}

export async function GET(request: NextRequest) {
  console.log('[Threads] Starting Nano Banana / Gemini prompt ingestion...');

  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let totalProcessed = 0;
  let totalSaved = 0;
  let skippedNoPrompt = 0;
  let skippedDuplicate = 0;
  let skippedNoImage = 0;
  const errors: string[] = [];

  for (const username of THREADS_PROMPT_ACCOUNTS) {
    try {
      console.log(`[Threads] Fetching @${username}...`);
      const posts = await fetchThreadsUserPosts(username, 25);

      if (!posts.length) {
        console.log(`[Threads] @${username}: no posts`);
        continue;
      }

      console.log(`[Threads] @${username}: ${posts.length} posts`);

      for (const post of posts) {
        totalProcessed++;

        try {
          // Must have an image
          if (!post.imageUrl) {
            skippedNoImage++;
            continue;
          }

          // Must look like a Gemini / photo prompt
          if (!isGeminiPhotoPrompt(post.text)) {
            skippedNoPrompt++;
            continue;
          }

          // Deduplicate by Threads post ID
          const sourceId = `threads_${post.id}`;
          const existing = await prisma.promptPost.findUnique({
            where: { tweetId: sourceId },
          });
          if (existing) {
            skippedDuplicate++;
            continue;
          }

          const promptText = extractThreadsPrompt(post.text);

          // Skip if extraction failed to produce meaningful content
          if (!promptText || promptText.length < 25) {
            skippedNoPrompt++;
            continue;
          }
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

          totalSaved++;
          console.log(
            `[Threads] +${post.likeCount}❤️ @${post.username}: "${post.text.slice(0, 60)}..."`
          );

          await new Promise((r) => setTimeout(r, 500));
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`${post.id}: ${msg}`);
        }
      }

      // Polite pause between accounts
      await new Promise((r) => setTimeout(r, 3000));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Threads] @${username} error: ${msg}`);
      errors.push(`@${username}: ${msg}`);
    }
  }

  const summary = {
    success: true,
    source: 'threads',
    accounts: THREADS_PROMPT_ACCOUNTS,
    processed: totalProcessed,
    saved: totalSaved,
    filtered: {
      noImage: skippedNoImage,
      noPrompt: skippedNoPrompt,
      duplicate: skippedDuplicate,
    },
    errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    timestamp: new Date().toISOString(),
  };

  console.log('[Threads] Complete:', JSON.stringify(summary, null, 2));
  return NextResponse.json(summary);
}

export const dynamic = 'force-dynamic';
