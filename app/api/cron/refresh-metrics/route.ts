import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateViralScore } from '@/lib/x-api';

// Protect cron route
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  const secret = request.nextUrl.searchParams.get('secret');
  return secret === cronSecret;
}

export async function GET(request: NextRequest) {
  console.log('[CRON] Starting metrics refresh...');

  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const bearerToken = process.env.X_BEARER_TOKEN;
    if (!bearerToken) {
      throw new Error('X_BEARER_TOKEN is not configured');
    }

    // Get posts from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentPosts = await prisma.promptPost.findMany({
      where: {
        createdAtX: {
          gte: sevenDaysAgo,
        },
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        tweetId: true,
      },
    });

    console.log(`[CRON] Refreshing metrics for ${recentPosts.length} posts`);

    let updated = 0;
    const errors: string[] = [];

    // Process in batches of 100 (X API limit)
    const batchSize = 100;
    for (let i = 0; i < recentPosts.length; i += batchSize) {
      const batch = recentPosts.slice(i, i + batchSize);
      const tweetIds = batch.map((p) => p.tweetId).join(',');

      try {
        const url = `https://api.twitter.com/2/tweets?ids=${tweetIds}&tweet.fields=public_metrics`;
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`X API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.data) {
          for (const tweet of data.data) {
            const post = batch.find((p) => p.tweetId === tweet.id);
            if (!post) continue;

            const viralScore = calculateViralScore(tweet.public_metrics);

            await prisma.promptPost.update({
              where: { id: post.id },
              data: {
                likeCount: tweet.public_metrics.like_count,
                repostCount: tweet.public_metrics.retweet_count,
                replyCount: tweet.public_metrics.reply_count,
                quoteCount: tweet.public_metrics.quote_count,
                viralScore,
              },
            });

            updated++;
          }
        }

        // Rate limit between batches
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[CRON] Error refreshing batch:`, errorMsg);
        errors.push(errorMsg);
      }
    }

    const summary = {
      success: true,
      checked: recentPosts.length,
      updated,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    };

    console.log('[CRON] Metrics refresh complete:', summary);

    return NextResponse.json(summary);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[CRON] Fatal error:', errorMsg);

    return NextResponse.json(
      {
        error: 'Metrics refresh failed',
        details: errorMsg,
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
