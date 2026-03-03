/**
 * Threads.net API Integration
 * Uses the `threads-api` npm package (unofficial reverse-engineered client)
 * Focused on collecting Nano Banana / Gemini photo transformation prompts
 */

// Seed accounts — always included, known to post high-quality prompts
export const SEED_ACCOUNTS = [
  'promptronix',
  'moskito.man',
  'ajayshahofficial',
  'gptinsiderai',
  'ui.johnson',
  'googlegeminiprompts',
];

// Keep the old export name so nothing else breaks
export const THREADS_PROMPT_ACCOUNTS = SEED_ACCOUNTS;

// Keywords used to discover new prompt accounts via searchUsers
const DISCOVERY_QUERIES = [
  'gemini prompt',
  'nano banana',
  'ai photo prompt',
  'nanobanana prompts',
  'gemini ai photo',
];

/**
 * Discover up to `maxTotal` Threads accounts that likely post AI prompts.
 * Seeds from SEED_ACCOUNTS, then expands via keyword search.
 */
export async function discoverAccounts(maxTotal = 30): Promise<string[]> {
  const client = await getThreadsClient();
  const pool = new Set<string>(SEED_ACCOUNTS);

  for (const query of DISCOVERY_QUERIES) {
    if (pool.size >= maxTotal) break;
    try {
      const result = await client.searchUsers(query, 10);
      for (const user of result?.users ?? []) {
        if (!user.username) continue;
        // Skip accounts with very few followers — unlikely to have viral content
        if (user.follower_count != null && user.follower_count < 300) continue;
        pool.add(user.username);
        if (pool.size >= maxTotal) break;
      }
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.warn(`[Threads] Discovery search failed for "${query}":`, err instanceof Error ? err.message : err);
    }
  }

  return Array.from(pool).slice(0, maxTotal);
}

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
  const username = process.env.THREADS_USERNAME;
  const password = process.env.THREADS_PASSWORD;

  return new ThreadsAPI({ deviceID, username, password });
}

/**
 * Fetch posts from a Threads account, sorted by viral score, returning the top `topN`.
 * Internally fetches up to `fetchLimit` posts and picks the best ones.
 */
export async function fetchThreadsUserPosts(
  username: string,
  topN: number = 8,
  fetchLimit: number = 25
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

  for (const thread of threads.slice(0, fetchLimit)) {
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

  // Return only the most viral posts
  results.sort((a, b) => b.viralScore - a.viralScore);
  return results.slice(0, topN);
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
    // Gemini-specific
    /open gemini/i,
    /nano banana/i,
    /gemini.*prompt/i,
    /upload.*photo.*prompt/i,
    /paste.*prompt/i,
    /use this prompt/i,
    /gemini app/i,
    /#nanobanana/i,
    /#nanobananaprompts/i,
    /#googlenanobanana/i,
    /#geminiprompt/i,
    // Generic strong prompt content signals
    /aspect ratio.*\d+:\d+/i,
    /photorealistic.*portrait/i,
    /ultra.*sharp.*macro/i,
    /cinematic.*portrait/i,
    /quality:\s*4k/i,
    /negative prompt/i,
    /ultra-realistic.*portrait/i,
    /4k.*ultra.*hd/i,
  ];

  // Must match at least one signal AND have enough text to be a real prompt
  return geminiSignals.some((pattern) => pattern.test(text)) && text.length > 40;
}

/**
 * Validate that extracted prompt text is substantive — not a promo, news post,
 * or engagement-bait with the real content hidden behind an external link.
 *
 * Returns true if the text is a real prompt worth saving.
 */
export function isSubstantivePrompt(text: string): boolean {
  if (!text || text.length < 80) return false;

  // Reject: promo / external-link bait
  const PROMO_PATTERNS = [
    /join\s+from\s+here/i,
    /check\s+my\s+(link|bio)/i,
    /shorturl\.|bit\.ly|tinyurl\.|t\.me\/|linktr\.|beacons\.ai/i,
    /\d+\s+free\s+prompts?/i,
    /get\s+(all\s+)?(the\s+)?prompts?\s+(in|to)\s+your\s+DM/i,
    /comment\s+\S+\s+to\s+(get|receive|unlock|claim)/i,
    /DM\s+me\s+(for|to\s+get)/i,
  ];
  if (PROMO_PATTERNS.some((p) => p.test(text))) return false;

  // Reject: product news / reviews (posts about the AI tool, not an image prompt)
  const NEWS_PATTERNS = [
    /just\s+dropped\s+and\s+this/i,
    /just\s+dropped\s+(and|–|—|:)/i,
    /now\s+(available|live)\s+on\s+\w/i,
    /^nano banana\s+\d/i,              // "Nano Banana 2 just..." — version news
    /is\s+now\s+on\s+(gamma|figma|notion|canva)/i,
  ];
  if (NEWS_PATTERNS.some((p) => p.test(text))) return false;

  // Must contain visual/image descriptor language typical of a real AI prompt
  const VISUAL_SIGNAL =
    /portrait|cinematic|photograph|studio|lighting|background|wearing|jacket|shirt|hair|face|skin|shadow|bokeh|depth\s+of\s+field|composition|editorial|realistic|8K|4K|UHD|sharp|blur|render/i;

  return VISUAL_SIGNAL.test(text);
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

  // Remove Threads/Gemini app navigation boilerplate in all their forms:
  //   "Open Gemini"  /  "1. Open ChatGPT / Gemini📲"  /  "2. Upload Your Photo 📸"  /  "3. Paste the prompt 👇"
  const BOILERPLATE_PATTERNS = [
    /^open\s+(gemini|chatgpt|gpt).{0,30}$/i,              // "Open Gemini" / "Open ChatGPT / Gemini📲"
    /^\d+\.\s*open\s+(gemini|chatgpt|gpt).{0,40}$/i,      // "1. Open Gemini" / "1. Open ChatGPT / Gemini📲"
    /^upload\s+(your\s+)?(photo|image).{0,20}$/i,          // "Upload Your Photo 📸"
    /^\d+\.\s*upload\s+(your\s+)?(photo|image).{0,20}$/i,  // "2. Upload Your Photo 📸"
    /^\d+\.\s*(paste|copy|use)\s+(the\s+)?(prompt|this prompt).*$/i, // "3. Paste the prompt 👇" / "3. Paste the prompt & Replace..."
    /^gemini\s+ai\s+prompt\.?$/i,                          // "Gemini AI prompt."
    /^\d+\.\s*gemini\s+ai\s+prompt\.?$/i,
  ];

  const lines = text.split('\n');
  const filteredLines = lines.filter((line) => {
    const l = line.trim();
    return !BOILERPLATE_PATTERNS.some((p) => p.test(l));
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
