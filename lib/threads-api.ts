/**
 * Threads.net API Integration
 * Uses the `threads-api` npm package (unofficial reverse-engineered client)
 * Focused on collecting Nano Banana / Gemini photo transformation prompts
 */

// Accounts known to post Gemini / Nano Banana photo prompts
export const THREADS_PROMPT_ACCOUNTS = [
  'moskito.man',        // High-quality Gemini photo transformation prompts
  'googlegeminiprompts', // Gemini / Nano Banana prompts
  'wito.0',             // AI tools + prompts (mixed Spanish/English)
];

export interface ThreadsPost {
  id: string;
  code: string;
  text: string;
  likeCount: number;
  replyCount: number;
  imageUrl: string | null;
  imageUrls: string[];
  postUrl: string;
  username: string;
  authorName: string;
  createdAt: Date;
  viralScore: number;
}

export interface ThreadsApiPost {
  pk: string;
  code: string;
  caption?: { text: string };
  like_count?: number;
  text_post_app_info?: { direct_reply_count?: number };
  image_versions2?: {
    candidates?: Array<{ url: string; width: number; height: number }>;
  };
  carousel_media?: Array<{
    image_versions2?: {
      candidates?: Array<{ url: string; width: number; height: number }>;
    };
  }>;
  taken_at?: number;
  user?: { username: string; full_name: string };
}

export interface ThreadsApiThread {
  thread_items?: Array<{ post: ThreadsApiPost; reply_facepile_users?: unknown[] }>;
}

/**
 * Lazy-load the threads-api package (CommonJS interop)
 */
async function getThreadsClient() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pkg = require('threads-api');
  const { ThreadsAPI } = pkg;

  const deviceID = process.env.THREADS_DEVICE_ID || 'android-bestphotoprompt';
  return new ThreadsAPI({ deviceID });
}

/**
 * Fetch posts from a Threads account and return normalized ThreadsPost[]
 */
export async function fetchThreadsUserPosts(
  username: string,
  limit: number = 25
): Promise<ThreadsPost[]> {
  const client = await getThreadsClient();

  const userID = await client.getUserIDfromUsername(username);
  if (!userID) {
    console.log(`[Threads] User not found: @${username}`);
    return [];
  }

  const threads: ThreadsApiThread[] = await client.getUserProfileThreads(userID);
  if (!threads || threads.length === 0) {
    return [];
  }

  const results: ThreadsPost[] = [];

  for (const thread of threads.slice(0, limit)) {
    const post = thread?.thread_items?.[0]?.post;
    if (!post) continue;

    // Gather text from all thread items (sometimes Part 2 is a reply)
    const allText = thread.thread_items!
      .map((item) => item.post?.caption?.text || '')
      .filter(Boolean)
      .join('\n\n');
    const text = allText || '';

    const likeCount = post.like_count || 0;
    const replyCount = post.text_post_app_info?.direct_reply_count || 0;

    // Collect all images — carousel + images from additional thread items
    const allImageUrls: string[] = [];
    for (const item of thread.thread_items!) {
      const itemPost = item.post;
      if (!itemPost) continue;
      if (itemPost.carousel_media?.length) {
        // Carousel: collect first (best quality) candidate from each slide
        for (const slide of itemPost.carousel_media) {
          const url = slide.image_versions2?.candidates?.[0]?.url;
          if (url) allImageUrls.push(url);
        }
      } else {
        const url = extractThreadsImage(itemPost);
        if (url) allImageUrls.push(url);
      }
    }

    const imageUrl = allImageUrls[0] || null;
    const postUrl = `https://www.threads.net/@${username}/post/${post.code}`;
    const createdAt = post.taken_at ? new Date(post.taken_at * 1000) : new Date();
    const viralScore = calculateThreadsScore(likeCount, replyCount);

    results.push({
      id: post.pk,
      code: post.code,
      text,
      likeCount,
      replyCount,
      imageUrl,
      imageUrls: allImageUrls,
      postUrl,
      username,
      authorName: post.user?.full_name || username,
      createdAt,
      viralScore,
    });
  }

  return results;
}

/**
 * Extract the best available image URL from a Threads post
 */
export function extractThreadsImage(post: ThreadsApiPost): string | null {
  const candidates = post.image_versions2?.candidates;
  if (!candidates || candidates.length === 0) return null;

  // Prefer largest image (first candidate is usually highest resolution)
  return candidates[0]?.url || null;
}

/**
 * Viral score for Threads posts
 */
export function calculateThreadsScore(likeCount: number, replyCount: number): number {
  return likeCount * 1 + replyCount * 2;
}

/**
 * Check if a post is a Nano Banana / Gemini photo prompt with extractable text.
 * Returns false if the prompt is hidden in comments (we can't use those).
 */
export function isGeminiPhotoPrompt(text: string): boolean {
  if (!text || text.length < 20) return false;

  // Skip posts where the actual prompt is hidden in comments
  if (isPromptHiddenInComments(text)) return false;

  const geminiSignals = [
    /open gemini/i,
    /nano banana/i,
    /gemini.*prompt/i,
    /upload.*photo.*prompt/i,
    /gemini app/i,
    /#nanobanana/i,
    /#nanobananaprompts/i,
    /#googlenanobanana/i,
    /#geminiprompt/i,
    // Generic strong prompt signals — long descriptive text
    /aspect ratio.*\d+:\d+/i,
    /photorealistic.*portrait/i,
    /ultra.*sharp.*macro/i,
    /cinematic.*portrait/i,
    /quality:\s*4k/i,
  ];

  // Must match at least one signal AND have enough text to be a real prompt
  return geminiSignals.some((pattern) => pattern.test(text)) && text.length > 40;
}

/**
 * Returns true if this post doesn't contain a usable prompt
 * (e.g., "complete prompt in comments")
 */
export function isPromptHiddenInComments(text: string): boolean {
  return /complet\w*\s+prompt\s+in\s+comments?/i.test(text) ||
    /prompt\s+in\s+comments?/i.test(text) ||
    /comment\s+["""'']?prompt["""'']?\s+👇/i.test(text) ||
    /just\s+comment\s+["""'']?prompt["""'']?/i.test(text);
}

/**
 * Extract the clean prompt text from a Threads post.
 * Only strips the exact "Open Gemini" / "Upload Photo" Threads-specific boilerplate.
 * Keeps all other content (labels, negative prompts, multi-part prompts).
 * Returns empty string if no meaningful prompt text found.
 */
export function extractThreadsPrompt(text: string): string {
  if (!text) return '';

  // Bail early if the full prompt is hidden in comments
  if (isPromptHiddenInComments(text)) return '';

  // Only remove the exact Threads/Gemini app boilerplate header lines
  const EXACT_BOILERPLATE = new Set(['open gemini', 'upload photo', 'upload your photo']);

  const lines = text.split('\n');
  const filteredLines = lines.filter((line) => {
    const l = line.trim().toLowerCase();
    return !EXACT_BOILERPLATE.has(l);
  });
  let cleaned = filteredLines.join('\n');

  // Remove social/engagement noise (URLs, follow-me calls, hashtag blocks)
  cleaned = cleaned
    .replace(/https?:\/\/\S+/g, '')
    .replace(/follow\s+(me|us)\s+for\s+more.*/gi, '')
    .replace(/comment\s+["'']?\w+["'']?\s*(👇|⬇|below|and)?.*/gi, '')
    .replace(/just\s+comment.*/gi, '')
    .replace(/(?:#\w+\s*)+$/gm, '')
    .replace(/^\s*[@#]\w+\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Reject if what's left is too short to be a real prompt
  if (cleaned.length < 25) return '';

  return cleaned;
}

/**
 * Detect AI model from Threads post text
 */
export function detectThreadsModel(text: string): string {
  const lower = text.toLowerCase();

  if (/nano banana|nanobanana/i.test(text)) return 'GEMINI';
  if (/gemini/i.test(text)) return 'GEMINI';
  if (/midjourney|\bmj\b|--v \d/i.test(text)) return 'MIDJOURNEY';
  if (/flux\b/i.test(lower)) return 'FLUX';
  if (/sdxl/i.test(lower)) return 'SDXL';
  if (/stable diffusion/i.test(lower)) return 'STABLE_DIFFUSION';
  if (/dall-?e/i.test(lower)) return 'DALLE';
  if (/chatgpt|gpt-4|gpt4/i.test(lower)) return 'CHATGPT';

  return 'UNKNOWN';
}

/**
 * Extract style/theme tags from Threads post text
 */
export function extractThreadsTags(text: string): string[] {
  const tags: Set<string> = new Set();
  const lower = text.toLowerCase();

  const tagMap: Record<string, string> = {
    'cinematic': 'cinematic',
    'portrait': 'portrait',
    'landscape': 'landscape',
    'product': 'product',
    'anime': 'anime',
    'realistic': 'realistic',
    'photorealistic': 'realistic',
    'abstract': 'abstract',
    'fantasy': 'fantasy',
    'sci-fi': 'sci-fi',
    'photography': 'photography',
    '3d': '3d',
    'illustration': 'illustration',
    'fashion': 'fashion',
    'editorial': 'editorial',
    'luxury': 'luxury',
    'surreal': 'surreal',
    'macro': 'macro',
    'noir': 'noir',
    'neon': 'neon',
    'cyberpunk': 'cyberpunk',
    'vintage': 'vintage',
    'retro': 'retro',
    'transformation': 'transformation',
    'nano banana': 'nano-banana',
    'gemini': 'gemini',
  };

  for (const [keyword, tag] of Object.entries(tagMap)) {
    if (lower.includes(keyword)) {
      tags.add(tag);
    }
  }

  return Array.from(tags).slice(0, 6);
}

/**
 * Extract aspect ratio from text (e.g. "9:16", "16:9")
 */
export function extractThreadsAspectRatio(text: string): string | null {
  const match = text.match(/(?:aspect ratio[:\s]+)?(\d+:\d+)/i);
  return match ? match[1] : null;
}
