import { AIModel } from '@prisma/client';

export interface XTweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  attachments?: {
    media_keys?: string[];
  };
  public_metrics: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
    quote_count: number;
  };
}

export interface XMedia {
  media_key: string;
  type: string;
  url?: string;
  preview_image_url?: string;
}

export interface XUser {
  id: string;
  username: string;
  name: string;
}

export interface XSearchResponse {
  data?: XTweet[];
  includes?: {
    users?: XUser[];
    media?: XMedia[];
  };
  meta: {
    result_count: number;
    next_token?: string;
  };
}

export interface XOEmbedResponse {
  html: string;
  url: string;
  author_name: string;
  author_url: string;
}

/**
 * Search for recent tweets using X API v2
 */
export async function searchRecentTweets(
  query: string,
  maxResults: number = 100
): Promise<XSearchResponse> {
  const bearerToken = process.env.X_BEARER_TOKEN;
  if (!bearerToken) {
    throw new Error('X_BEARER_TOKEN is not configured');
  }

  const params = new URLSearchParams({
    query,
    max_results: String(maxResults),
    'tweet.fields': 'created_at,public_metrics,author_id,attachments',
    expansions: 'author_id,attachments.media_keys',
    'user.fields': 'username,name',
    'media.fields': 'url,preview_image_url,type',
  });

  const url = `https://api.twitter.com/2/tweets/search/recent?${params}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`X API error: ${response.status} ${error}`);
  }

  return response.json();
}

/**
 * Get tweet oEmbed HTML
 */
export async function getTweetOEmbed(tweetUrl: string): Promise<XOEmbedResponse> {
  const params = new URLSearchParams({
    url: tweetUrl,
    omit_script: 'true',
    dnt: 'true',
  });

  const url = `https://publish.twitter.com/oembed?${params}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`oEmbed error: ${response.status}`);
  }

  return response.json();
}

/**
 * Build tweet URL from tweet ID and username
 */
export function buildTweetUrl(username: string, tweetId: string): string {
  return `https://twitter.com/${username}/status/${tweetId}`;
}

/**
 * Calculate viral score from public metrics
 */
export function calculateViralScore(metrics: {
  like_count: number;
  retweet_count: number;
  reply_count: number;
  quote_count: number;
}): number {
  return (
    metrics.like_count * 1 +
    metrics.retweet_count * 2 +
    metrics.reply_count * 1.5 +
    metrics.quote_count * 2.5
  );
}

/**
 * Extract prompt text from tweet text using deterministic parser
 */
export function extractPromptText(tweetText: string): string {
  // Remove URLs
  let cleaned = tweetText.replace(/https?:\/\/\S+/g, '');

  // Look for explicit "Prompt:" or "PROMPT:" markers
  const promptMarkers = [
    /prompt:\s*/i,
    /🎨\s*prompt:\s*/i,
    /✨\s*prompt:\s*/i,
  ];

  for (const marker of promptMarkers) {
    const match = cleaned.match(new RegExp(marker.source + '([\\s\\S]+)', 'i'));
    if (match) {
      cleaned = match[1];
      break;
    }
  }

  // Remove common hashtags that aren't part of the prompt
  const commonHashtags = [
    '#AIart',
    '#Midjourney',
    '#StableDiffusion',
    '#SDXL',
    '#Flux',
    '#AI',
    '#AIgenerated',
    '#generativeart',
  ];

  for (const tag of commonHashtags) {
    cleaned = cleaned.replace(new RegExp(tag, 'gi'), '');
  }

  // Clean up extra whitespace while preserving intentional newlines
  cleaned = cleaned
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');

  return cleaned.trim();
}

/**
 * Detect AI model from tweet text
 */
export function detectAIModel(text: string): AIModel {
  const lower = text.toLowerCase();

  if (lower.includes('midjourney') || lower.includes('mj')) {
    return AIModel.MIDJOURNEY;
  }
  if (lower.includes('flux')) {
    return AIModel.FLUX;
  }
  if (lower.includes('sdxl')) {
    return AIModel.SDXL;
  }
  if (lower.includes('stable diffusion') || lower.includes('sd ')) {
    return AIModel.STABLE_DIFFUSION;
  }
  if (lower.includes('chatgpt') || lower.includes('gpt-4')) {
    return AIModel.CHATGPT;
  }
  if (lower.includes('dall-e') || lower.includes('dalle')) {
    return AIModel.DALLE;
  }

  return AIModel.UNKNOWN;
}

/**
 * Extract tags from tweet text
 */
export function extractTags(text: string): string[] {
  const tags: string[] = [];
  const lower = text.toLowerCase();

  const tagKeywords = [
    'cinematic',
    'portrait',
    'landscape',
    'product',
    'anime',
    'realistic',
    'abstract',
    'fantasy',
    'sci-fi',
    'photography',
    '3d',
    'render',
    'illustration',
    'concept art',
    'character design',
  ];

  for (const keyword of tagKeywords) {
    if (lower.includes(keyword)) {
      tags.push(keyword);
    }
  }

  return tags;
}

/**
 * Extract aspect ratio if present (e.g., --ar 16:9)
 */
export function extractAspectRatio(text: string): string | null {
  const arMatch = text.match(/--ar\s+(\d+:\d+)/i);
  if (arMatch) {
    return arMatch[1];
  }

  const ratioMatch = text.match(/\b(\d+:\d+)\b/);
  if (ratioMatch) {
    return ratioMatch[1];
  }

  return null;
}

/**
 * Extract image URL from tweet (AI-generated image)
 */
export function extractImageUrl(tweet: XTweet, media?: XMedia[]): string | null {
  if (!tweet.attachments?.media_keys || !media) {
    return null;
  }

  // Find the first media item
  const mediaKey = tweet.attachments.media_keys[0];
  const mediaItem = media.find((m) => m.media_key === mediaKey);

  if (!mediaItem) {
    return null;
  }

  // Return the highest quality URL available
  return mediaItem.url || mediaItem.preview_image_url || null;
}

/**
 * Check if tweet is relevant (quality filter)
 */
export function isRelevantTweet(text: string): boolean {
  const lower = text.toLowerCase();

  const relevantKeywords = [
    'prompt',
    'midjourney',
    'stable diffusion',
    'sdxl',
    'flux',
    '--ar',
    'cinematic',
    'photorealistic',
    'generated',
    'ai art',
  ];

  // Must contain at least one relevant keyword
  const hasKeyword = relevantKeywords.some((keyword) => lower.includes(keyword));

  // Filter out retweets and replies (usually start with RT or @)
  const isRetweet = text.startsWith('RT ') || text.startsWith('RT@');
  const isReply = text.startsWith('@');

  // Must have reasonable length
  const hasContent = text.length >= 50;

  return hasKeyword && !isRetweet && !isReply && hasContent;
}
