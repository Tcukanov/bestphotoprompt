/**
 * Reddit API Integration (FREE - No API key needed for public data!)
 * Collects ONLY viral photo prompts. No videos, no low-engagement posts.
 */

export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  created_utc: number;
  permalink: string;
  url: string;
  score: number;
  num_comments: number;
  thumbnail?: string;
  is_video?: boolean;
  is_gallery?: boolean;
  post_hint?: string;
  domain?: string;
  preview?: {
    images: Array<{
      source: {
        url: string;
        width: number;
        height: number;
      };
      resolutions: Array<{
        url: string;
        width: number;
        height: number;
      }>;
    }>;
  };
  media?: {
    reddit_video?: { fallback_url: string };
    oembed?: { type: string };
  };
  link_flair_text?: string;
  subreddit?: string;
}

export interface RedditResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
    after?: string;
  };
}

// ─── Viral Thresholds ────────────────────────────────────────────────
// Only collect posts that are genuinely viral / high engagement
const VIRAL_SCORE_MIN = 100;         // Minimum Reddit score (upvotes - downvotes)
const VIRAL_SCORE_MIN_COMMENTS = 5;  // Minimum comments to show real engagement

// ─── Video / Non-Photo Blocklist ─────────────────────────────────────
const VIDEO_DOMAINS = [
  'v.redd.it', 'youtube.com', 'youtu.be', 'vimeo.com',
  'streamable.com', 'gfycat.com', 'redgifs.com', 'twitch.tv',
  'tiktok.com', 'vm.tiktok.com',
];

const VIDEO_EXTENSIONS = /\.(mp4|mov|avi|webm|mkv|gifv)(\?.*)?$/i;

const VIDEO_KEYWORDS = [
  'video', 'animation', 'animated', 'timelapse', 'time-lapse',
  'time lapse', 'workflow video', 'tutorial video', 'speed edit',
  'making of', 'process video', 'sora', 'runway', 'pika',
  'kling', 'luma', 'gen-2', 'gen2', 'animate', 'motion',
  'img2vid', 'txt2vid', 'text2video', 'video generation',
];

const VIDEO_FLAIRS = [
  'video', 'animation', 'gif', 'tutorial', 'workflow',
  'sora', 'runway', 'pika', 'kling',
];

// Flairs that indicate NON-prompt content (memes, politics, discussion-only)
const REJECTED_FLAIRS = [
  'meme', 'memes', 'humor', 'funny', 'shitpost', 'politics',
  'news', 'discussion', 'question', 'help', 'meta', 'rant',
  'drama', 'off-topic', 'rule', 'mod', 'announcement',
];

// Title patterns that indicate low-quality / non-prompt posts
const REJECTED_TITLE_PATTERNS = [
  /^(lol|lmao|bruh|omg)\b/i,
  /who (else|did this)/i,
  /unpopular opinion/i,
  /am i the only/i,
  /does anyone else/i,
  /rate my/i,
];

/**
 * Fetch posts from a subreddit (NO AUTH NEEDED!)
 */
export async function fetchRedditPosts(
  subreddit: string,
  limit: number = 100,
  sort: 'hot' | 'new' | 'top' = 'hot',
  timeframe?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all'
): Promise<RedditResponse> {
  let url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}&raw_json=1`;

  if (sort === 'top' && timeframe) {
    url += `&t=${timeframe}`;
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; BestPhotoPrompt/1.0; +https://bestphotoprompt.com)',
      Accept: 'application/json',
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Reddit API error: ${response.status}`);
  }

  return response.json();
}

// ─── Video Detection ─────────────────────────────────────────────────

/**
 * Comprehensive check: is this post a video or non-photo?
 * Returns true if the post should be REJECTED (it's video content).
 */
export function isVideoPost(post: RedditPost): boolean {
  // Reddit native video flag
  if (post.is_video) return true;

  // Reddit video media
  if (post.media?.reddit_video) return true;
  if (post.media?.oembed?.type === 'video') return true;

  // post_hint tells us the type
  if (post.post_hint === 'hosted:video' || post.post_hint === 'rich:video') return true;

  // Video domain
  if (post.domain && VIDEO_DOMAINS.some((d) => post.domain!.includes(d))) return true;

  // Video file extension in URL
  if (post.url && VIDEO_EXTENSIONS.test(post.url)) return true;

  // .gifv is essentially video (imgur)
  if (post.url?.endsWith('.gifv')) return true;

  // Video keywords in title or flair
  const titleLower = post.title.toLowerCase();
  if (VIDEO_KEYWORDS.some((kw) => titleLower.includes(kw))) return true;

  // Video flair
  if (post.link_flair_text) {
    const flairLower = post.link_flair_text.toLowerCase();
    if (VIDEO_FLAIRS.some((f) => flairLower.includes(f))) return true;
  }

  return false;
}

// ─── Image Extraction ────────────────────────────────────────────────

/**
 * Extract a static photo URL from Reddit post.
 * Returns null if no valid photo found.
 */
export function extractRedditImage(post: RedditPost): string | null {
  // Reject any video content first
  if (isVideoPost(post)) return null;

  // Skip GIFs -- we want still images only
  if (post.url && /\.gif(\?.*)?$/i.test(post.url)) return null;

  // Direct image URL (i.redd.it, imgur, etc.)
  if (post.url && /\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(post.url)) {
    return post.url;
  }

  // Reddit preview (highest resolution source)
  if (post.preview?.images?.[0]?.source?.url) {
    return post.preview.images[0].source.url.replace(/&amp;/g, '&');
  }

  // Imgur links without extension (not albums/galleries)
  if (
    post.url &&
    post.url.includes('imgur.com') &&
    !post.url.includes('/a/') &&
    !post.url.includes('/gallery/')
  ) {
    return post.url + '.jpg';
  }

  return null;
}

// ─── Aspect Ratio ────────────────────────────────────────────────────

export function extractAspectRatio(post: RedditPost): string | null {
  const source = post.preview?.images?.[0]?.source;
  if (!source) return null;

  const { width, height } = source;
  const ratio = width / height;

  if (Math.abs(ratio - 1) < 0.1) return '1:1';
  if (Math.abs(ratio - 16 / 9) < 0.15) return '16:9';
  if (Math.abs(ratio - 9 / 16) < 0.15) return '9:16';
  if (Math.abs(ratio - 4 / 3) < 0.15) return '4:3';
  if (Math.abs(ratio - 3 / 4) < 0.15) return '3:4';
  if (Math.abs(ratio - 3 / 2) < 0.15) return '3:2';
  if (Math.abs(ratio - 2 / 3) < 0.15) return '2:3';

  return null;
}

// ─── Prompt Extraction ───────────────────────────────────────────────

export function extractRedditPrompt(post: RedditPost): string {
  const title = post.title.trim();
  const body = post.selftext.trim();

  // Try to extract from body first (often has the full prompt)
  if (body) {
    const promptPatterns = [
      /(?:prompt|PROMPT)\s*[:=]\s*([\s\S]+?)(?:\n\n|negative|settings|params|$)/i,
      /(?:full prompt|here'?s? (?:the|my) prompt)\s*[:=]?\s*([\s\S]+?)(?:\n\n|negative|$)/i,
      /```([\s\S]+?)```/,
      /"([^"]{20,})"/,
    ];

    for (const pattern of promptPatterns) {
      const match = body.match(pattern);
      if (match?.[1] && match[1].trim().length > 15) {
        return match[1].trim();
      }
    }

    if (body.length > 30) {
      return cleanPromptText(body);
    }
  }

  return cleanPromptText(title);
}

function cleanPromptText(text: string): string {
  return text
    .replace(/^(Prompt:|PROMPT:|My prompt:|prompt:)\s*/i, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Model Detection ─────────────────────────────────────────────────

export function detectModelFromReddit(post: RedditPost, subreddit: string): string {
  const text = (post.title + ' ' + post.selftext + ' ' + (post.link_flair_text || '')).toLowerCase();

  const sub = subreddit.toLowerCase();
  if (sub.includes('midjourney')) return 'MIDJOURNEY';
  if (sub.includes('stablediffusion')) return 'STABLE_DIFFUSION';
  if (sub.includes('dalle')) return 'DALLE';
  if (sub.includes('flux')) return 'FLUX';

  if (post.link_flair_text) {
    const flair = post.link_flair_text.toLowerCase();
    if (flair.includes('midjourney') || flair === 'mj') return 'MIDJOURNEY';
    if (flair.includes('flux')) return 'FLUX';
    if (flair.includes('sdxl')) return 'SDXL';
    if (flair.includes('sd') || flair.includes('stable diffusion')) return 'STABLE_DIFFUSION';
    if (flair.includes('dall')) return 'DALLE';
    if (flair.includes('chatgpt') || flair.includes('gpt')) return 'CHATGPT';
  }

  if (text.includes('midjourney') || /\bmj\b/.test(text) || text.includes('--v ') || text.includes('--ar ')) return 'MIDJOURNEY';
  if (text.includes('flux')) return 'FLUX';
  if (text.includes('sdxl')) return 'SDXL';
  if (text.includes('stable diffusion') || text.includes('sd 1.5') || text.includes('automatic1111') || text.includes('comfyui')) return 'STABLE_DIFFUSION';
  if (text.includes('dall-e') || text.includes('dalle')) return 'DALLE';
  if (text.includes('chatgpt') || text.includes('gpt-4') || text.includes('gpt4')) return 'CHATGPT';

  return 'UNKNOWN';
}

// ─── Viral Score ─────────────────────────────────────────────────────

export function calculateRedditScore(post: RedditPost): number {
  return post.score * 1 + post.num_comments * 2.5;
}

// ─── Content Quality Check ───────────────────────────────────────────

/**
 * Does this post look like it contains or references an actual AI prompt?
 * We want posts that share the prompt text, not just memes or screenshots.
 */
function looksLikePromptContent(post: RedditPost): boolean {
  const text = (post.title + ' ' + post.selftext).toLowerCase();

  // Strong signals: post explicitly shares a prompt
  const promptSignals = [
    /prompt\s*[:=]/i,           // "Prompt: ..."
    /here'?s?\s*(the|my)\s*prompt/i,
    /full prompt/i,
    /\bprompt\b/i,              // mentions "prompt" anywhere
    /--ar\s+\d/,                // Midjourney aspect ratio flag
    /--v\s+\d/,                 // Midjourney version flag
    /--s\s+\d/,                 // Midjourney stylize flag
    /--q\s+\d/,                 // Midjourney quality flag
    /\bcfg\s*(scale)?\s*[:=]?\s*\d/i, // SD cfg scale
    /\bsteps?\s*[:=]?\s*\d/i,  // SD steps
    /\bsampler\b/i,             // SD sampler
    /\blora\b/i,                // LoRA mention
    /\bcheckpoint\b/i,          // Model checkpoint
    /\bnegative\s*prompt/i,     // Negative prompt
    /\bseed\s*[:=]?\s*\d/i,    // Seed value
    /made (with|using|in)\s/i,  // "made with Midjourney"
    /generated (with|using|in|by)\s/i,
    /created (with|using|in|by)\s/i,
  ];

  return promptSignals.some((pattern) => pattern.test(text));
}

// ─── Relevance Check (STRICT: viral photo prompts only) ──────────────

/**
 * STRICT filter: only accept posts that are:
 *  1. A still photo (not video, not gif, not animation)
 *  2. Viral (high engagement score)
 *  3. Actually about an AI-generated image with prompt context
 *  4. Not a meme, political post, or discussion-only thread
 */
export function isRelevantRedditPost(post: RedditPost, isAiSubreddit: boolean = true): boolean {
  // ── HARD REJECT: any video content ──
  if (isVideoPost(post)) return false;

  // ── Must have a valid static image ──
  if (!extractRedditImage(post)) return false;

  // ── Skip very short / garbage titles ──
  if (post.title.length < 5) return false;

  // ── Skip deleted / removed ──
  if (post.author === '[deleted]' || post.selftext === '[removed]') return false;

  // ── REJECT: meme / politics / non-prompt flairs ──
  if (post.link_flair_text) {
    const flairLower = post.link_flair_text.toLowerCase();
    if (REJECTED_FLAIRS.some((f) => flairLower.includes(f))) return false;
  }

  // ── REJECT: low-quality title patterns ──
  if (REJECTED_TITLE_PATTERNS.some((p) => p.test(post.title))) return false;

  // ── VIRAL THRESHOLD ──
  if (post.score < VIRAL_SCORE_MIN) return false;

  // For AI-specific subreddits: every image post is AI-generated,
  // so we just need the viral + no-meme + photo checks above.
  // The prompt text will come from the title or body.
  if (isAiSubreddit) return true;

  // For general subreddits: must explicitly mention prompts or AI tools
  if (!looksLikePromptContent(post)) return false;

  const text = (post.title + ' ' + post.selftext).toLowerCase();
  const hasModelKeyword =
    text.includes('midjourney') ||
    text.includes('stable diffusion') ||
    text.includes('dalle') ||
    text.includes('dall-e') ||
    text.includes('flux') ||
    text.includes('sdxl') ||
    text.includes('comfyui');

  return hasModelKeyword;
}

// ─── Tag Extraction ──────────────────────────────────────────────────

export function extractRedditTags(post: RedditPost): string[] {
  const tags: Set<string> = new Set();
  const text = (post.title + ' ' + post.selftext + ' ' + (post.link_flair_text || '')).toLowerCase();

  const tagKeywords: Record<string, string> = {
    cinematic: 'cinematic',
    portrait: 'portrait',
    landscape: 'landscape',
    product: 'product',
    anime: 'anime',
    realistic: 'realistic',
    photorealistic: 'realistic',
    abstract: 'abstract',
    fantasy: 'fantasy',
    'sci-fi': 'sci-fi',
    scifi: 'sci-fi',
    photography: 'photography',
    '3d': '3d',
    render: 'render',
    illustration: 'illustration',
    'concept art': 'concept art',
    character: 'character',
    architecture: 'architecture',
    nature: 'nature',
    surreal: 'surreal',
    dark: 'dark',
    minimalist: 'minimalist',
    horror: 'horror',
    cute: 'cute',
    macro: 'macro',
    watercolor: 'watercolor',
    'oil painting': 'oil painting',
    retro: 'retro',
    vintage: 'vintage',
    neon: 'neon',
    cyberpunk: 'cyberpunk',
    steampunk: 'steampunk',
  };

  for (const [keyword, tag] of Object.entries(tagKeywords)) {
    if (text.includes(keyword)) {
      tags.add(tag);
    }
  }

  if (post.link_flair_text) {
    const flair = post.link_flair_text.toLowerCase().trim();
    if (flair.length > 1 && flair.length < 25 && !flair.includes('rule')) {
      tags.add(flair);
    }
  }

  return Array.from(tags).slice(0, 6);
}
