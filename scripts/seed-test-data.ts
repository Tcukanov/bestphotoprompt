import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test data...');

  // Create test prompts
  const prompts = [
    {
      tweetId: 'test_1234567890',
      tweetUrl: 'https://twitter.com/aiartist/status/1234567890',
      authorHandle: 'aiartist',
      authorName: 'AI Artist',
      createdAtX: new Date('2024-01-15'),
      rawText: 'Amazing Midjourney prompt: A cinematic shot of a futuristic city at sunset, neon lights, cyberpunk style, ultra detailed, 8k --ar 16:9',
      promptText: 'A cinematic shot of a futuristic city at sunset, neon lights, cyberpunk style, ultra detailed, 8k',
      embedHtml: '<blockquote class="twitter-tweet"><p>Test tweet</p></blockquote>',
      likeCount: 542,
      repostCount: 128,
      replyCount: 34,
      quoteCount: 12,
      viralScore: 542 + 128 * 2 + 34 * 1.5 + 12 * 2.5,
      tags: ['cinematic', 'landscape'],
      model: 'MIDJOURNEY',
      aspectRatio: '16:9',
      status: 'PUBLISHED',
    },
    {
      tweetId: 'test_2345678901',
      tweetUrl: 'https://twitter.com/fluxmaster/status/2345678901',
      authorHandle: 'fluxmaster',
      authorName: 'Flux Master',
      createdAtX: new Date('2024-01-16'),
      rawText: 'Flux prompt: Professional portrait photography, soft lighting, studio quality, high resolution',
      promptText: 'Professional portrait photography, soft lighting, studio quality, high resolution',
      embedHtml: '<blockquote class="twitter-tweet"><p>Test tweet 2</p></blockquote>',
      likeCount: 320,
      repostCount: 85,
      replyCount: 22,
      quoteCount: 8,
      viralScore: 320 + 85 * 2 + 22 * 1.5 + 8 * 2.5,
      tags: ['portrait', 'realistic'],
      model: 'FLUX',
      aspectRatio: null,
      status: 'PUBLISHED',
    },
    {
      tweetId: 'test_3456789012',
      tweetUrl: 'https://twitter.com/sdxl_pro/status/3456789012',
      authorHandle: 'sdxl_pro',
      authorName: 'SDXL Pro',
      createdAtX: new Date('2024-01-17'),
      rawText: 'SDXL prompt: Fantasy landscape with mountains, magical atmosphere, concept art style',
      promptText: 'Fantasy landscape with mountains, magical atmosphere, concept art style',
      embedHtml: '<blockquote class="twitter-tweet"><p>Test tweet 3</p></blockquote>',
      likeCount: 890,
      repostCount: 234,
      replyCount: 67,
      quoteCount: 29,
      viralScore: 890 + 234 * 2 + 67 * 1.5 + 29 * 2.5,
      tags: ['fantasy', 'landscape'],
      model: 'SDXL',
      aspectRatio: '16:9',
      status: 'PUBLISHED',
    },
    {
      tweetId: 'test_4567890123',
      tweetUrl: 'https://twitter.com/ai_creator/status/4567890123',
      authorHandle: 'ai_creator',
      authorName: 'AI Creator',
      createdAtX: new Date('2024-01-18'),
      rawText: 'Midjourney anime style: Beautiful anime girl, detailed eyes, colorful hair, vibrant colors --ar 9:16',
      promptText: 'Beautiful anime girl, detailed eyes, colorful hair, vibrant colors',
      embedHtml: '<blockquote class="twitter-tweet"><p>Test tweet 4</p></blockquote>',
      likeCount: 1240,
      repostCount: 356,
      replyCount: 89,
      quoteCount: 45,
      viralScore: 1240 + 356 * 2 + 89 * 1.5 + 45 * 2.5,
      tags: ['anime', 'portrait'],
      model: 'MIDJOURNEY',
      aspectRatio: '9:16',
      status: 'PUBLISHED',
    },
    {
      tweetId: 'test_5678901234',
      tweetUrl: 'https://twitter.com/productai/status/5678901234',
      authorHandle: 'productai',
      authorName: 'Product AI',
      createdAtX: new Date('2024-01-19'),
      rawText: 'Product photography prompt: Luxury watch on marble surface, studio lighting, commercial style',
      promptText: 'Luxury watch on marble surface, studio lighting, commercial style',
      embedHtml: '<blockquote class="twitter-tweet"><p>Test tweet 5</p></blockquote>',
      likeCount: 450,
      repostCount: 112,
      replyCount: 28,
      quoteCount: 14,
      viralScore: 450 + 112 * 2 + 28 * 1.5 + 14 * 2.5,
      tags: ['product', 'realistic'],
      model: 'STABLE_DIFFUSION',
      aspectRatio: null,
      status: 'PUBLISHED',
    },
  ];

  for (const prompt of prompts) {
    await prisma.promptPost.upsert({
      where: { tweetId: prompt.tweetId },
      create: prompt,
      update: prompt,
    });
  }

  console.log('✅ Created 5 test prompts');
  console.log('🎉 Test data seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
