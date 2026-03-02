import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  searchRecentTweets,
  getTweetOEmbed,
  buildTweetUrl,
  calculateViralScore,
  extractPromptText,
  detectAIModel,
  extractTags,
  extractAspectRatio,
  isRelevantTweet,
  extractImageUrl,
} from '@/lib/x-api';
import { PromptStatus } from '@prisma/client';

// Protect cron route
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET is not configured');
    return false;
  }

  // Check authorization header
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Check query parameter as fallback
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret === cronSecret) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  console.log('[CRON] Starting ingestion job...');

  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Build search query for AI image prompts
    const queries = [
      '(prompt Midjourney) OR (prompt SDXL) OR (prompt Flux) OR (prompt "Stable Diffusion")',
      'AI art prompt',
      'Midjourney --ar',
    ];

    let totalProcessed = 0;
    let totalSaved = 0;
    const errors: string[] = [];

    for (const query of queries) {
      try {
        console.log(`[CRON] Searching for: ${query}`);
        const searchResults = await searchRecentTweets(query, 100);

        if (!searchResults.data || searchResults.data.length === 0) {
          console.log(`[CRON] No results for query: ${query}`);
          continue;
        }

        console.log(`[CRON] Found ${searchResults.data.length} tweets`);

        // Process each tweet
        for (const tweet of searchResults.data) {
          totalProcessed++;

          try {
            // Quality filter
            if (!isRelevantTweet(tweet.text)) {
              console.log(`[CRON] Tweet ${tweet.id} filtered out (not relevant)`);
              continue;
            }

            // Check if already exists
            const existing = await prisma.promptPost.findUnique({
              where: { tweetId: tweet.id },
            });

            if (existing) {
              console.log(`[CRON] Tweet ${tweet.id} already exists, skipping`);
              continue;
            }

            // Find author info
            const author = searchResults.includes?.users?.find(
              (u) => u.id === tweet.author_id
            );

            if (!author) {
              console.log(`[CRON] No author info for tweet ${tweet.id}, skipping`);
              continue;
            }

            // Build tweet URL
            const tweetUrl = buildTweetUrl(author.username, tweet.id);

            // Extract prompt and metadata
            const promptText = extractPromptText(tweet.text);
            const model = detectAIModel(tweet.text);
            const tags = extractTags(tweet.text);
            const aspectRatio = extractAspectRatio(tweet.text);
            const viralScore = calculateViralScore(tweet.public_metrics);

            // Extract AI-generated image URL
            const imageUrl = extractImageUrl(tweet, searchResults.includes?.media);

            // Get oEmbed HTML
            let embedHtml: string | null = null;
            try {
              const oembedData = await getTweetOEmbed(tweetUrl);
              embedHtml = oembedData.html;
            } catch (err) {
              console.error(`[CRON] Failed to get oEmbed for ${tweet.id}:`, err);
              // Continue without embed
            }

            // Save to database
            await prisma.promptPost.create({
              data: {
                tweetId: tweet.id,
                tweetUrl,
                authorHandle: author.username,
                authorName: author.name,
                createdAtX: new Date(tweet.created_at),
                rawText: tweet.text,
                promptText,
                imageUrl,
                embedHtml,
                likeCount: tweet.public_metrics.like_count,
                repostCount: tweet.public_metrics.retweet_count,
                replyCount: tweet.public_metrics.reply_count,
                quoteCount: tweet.public_metrics.quote_count,
                viralScore,
                tags,
                model,
                aspectRatio,
                status: PromptStatus.PUBLISHED,
              },
            });

            totalSaved++;
            console.log(`[CRON] Saved tweet ${tweet.id} by @${author.username}`);

            // Rate limit: wait between requests
            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error(`[CRON] Error processing tweet ${tweet.id}:`, errorMsg);
            errors.push(`Tweet ${tweet.id}: ${errorMsg}`);
          }
        }

        // Wait between query batches
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[CRON] Error with query "${query}":`, errorMsg);
        errors.push(`Query "${query}": ${errorMsg}`);
      }
    }

    const summary = {
      success: true,
      processed: totalProcessed,
      saved: totalSaved,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    };

    console.log('[CRON] Ingestion complete:', summary);

    return NextResponse.json(summary);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[CRON] Fatal error:', errorMsg);

    return NextResponse.json(
      {
        error: 'Ingestion failed',
        details: errorMsg,
      },
      { status: 500 }
    );
  }
}

// Prevent static optimization
export const dynamic = 'force-dynamic';
