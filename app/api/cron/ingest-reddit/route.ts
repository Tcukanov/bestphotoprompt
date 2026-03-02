import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  fetchRedditPosts,
  extractRedditImage,
  extractRedditPrompt,
  detectModelFromReddit,
  calculateRedditScore,
  isRelevantRedditPost,
  isVideoPost,
  extractRedditTags,
  extractAspectRatio,
} from '@/lib/reddit-api';
import { AIModel, PromptStatus } from '@prisma/client';

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET is not configured');
    return false;
  }

  if (authHeader === `Bearer ${cronSecret}`) return true;

  const secret = request.nextUrl.searchParams.get('secret');
  return secret === cronSecret;
}

// Subreddits focused on AI-generated PHOTOS (no video-first subs)
const AI_PHOTO_SUBREDDITS = [
  'midjourney',
  'StableDiffusion',
  'aiArt',
  'dalle2',
  'FluxAI',
  'comfyui',
  'sdforall',
  'AIGeneratedArt',
];

export async function GET(request: NextRequest) {
  console.log('[CRON] Starting viral photo ingestion...');

  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let totalProcessed = 0;
    let totalSaved = 0;
    let skippedVideo = 0;
    let skippedLowScore = 0;
    let skippedNoImage = 0;
    let skippedDuplicate = 0;
    const errors: string[] = [];

    for (const subreddit of AI_PHOTO_SUBREDDITS) {
      try {
        console.log(`[CRON] r/${subreddit} ...`);

        // Fetch top posts of the month for viral content
        const response = await fetchRedditPosts(subreddit, 100, 'top', 'month');

        if (!response.data?.children?.length) {
          console.log(`[CRON] r/${subreddit}: empty`);
          continue;
        }

        const posts = response.data.children;
        console.log(`[CRON] r/${subreddit}: ${posts.length} posts fetched`);

        for (const { data: post } of posts) {
          totalProcessed++;

          try {
            // ── Video filter (hard reject) ──
            if (isVideoPost(post)) {
              skippedVideo++;
              continue;
            }

            // ── Full relevance + viral check ──
            if (!isRelevantRedditPost(post, true)) {
              if (post.score < 100) skippedLowScore++;
              else skippedNoImage++;
              continue;
            }

            // ── Deduplicate ──
            const existing = await prisma.promptPost.findUnique({
              where: { tweetId: `reddit_${post.id}` },
            });
            if (existing) {
              skippedDuplicate++;
              continue;
            }

            // ── Extract photo URL (double-check) ──
            const imageUrl = extractRedditImage(post);
            if (!imageUrl) {
              skippedNoImage++;
              continue;
            }

            const promptText = extractRedditPrompt(post);
            const model = detectModelFromReddit(post, subreddit);
            const tags = extractRedditTags(post);
            const viralScore = calculateRedditScore(post);
            const aspectRatio = extractAspectRatio(post);
            const postUrl = `https://www.reddit.com${post.permalink}`;

            await prisma.promptPost.create({
              data: {
                tweetId: `reddit_${post.id}`,
                tweetUrl: postUrl,
                authorHandle: `u/${post.author}`,
                authorName: post.author,
                createdAtX: new Date(post.created_utc * 1000),
                rawText: `${post.title}\n\n${post.selftext}`.trim(),
                promptText,
                imageUrl,
                embedHtml: null,
                likeCount: post.score,
                repostCount: 0,
                replyCount: post.num_comments,
                quoteCount: 0,
                viralScore,
                tags,
                model: model as AIModel,
                aspectRatio,
                status: PromptStatus.PUBLISHED,
              },
            });

            totalSaved++;
            console.log(`[CRON] +${post.score} "${post.title.slice(0, 60)}" (r/${subreddit})`);

            await new Promise((r) => setTimeout(r, 300));
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            errors.push(`${post.id}: ${msg}`);
          }
        }

        // Polite pause between subreddits
        await new Promise((r) => setTimeout(r, 2000));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[CRON] r/${subreddit} error: ${msg}`);
        errors.push(`r/${subreddit}: ${msg}`);
      }
    }

    const summary = {
      success: true,
      source: 'reddit',
      subreddits: AI_PHOTO_SUBREDDITS.length,
      processed: totalProcessed,
      saved: totalSaved,
      filtered: {
        video: skippedVideo,
        lowScore: skippedLowScore,
        noImage: skippedNoImage,
        duplicate: skippedDuplicate,
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      timestamp: new Date().toISOString(),
    };

    console.log('[CRON] Complete:', JSON.stringify(summary, null, 2));
    return NextResponse.json(summary);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[CRON] Fatal:', msg);
    return NextResponse.json({ error: 'Ingestion failed', details: msg }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
