import { PrismaClient, AIModel } from '@prisma/client';

const prisma = new PrismaClient();

const generatePrompts = () => {
  // Real working images from picsum.photos (high quality stock photos)
  const imageUrls = [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80', // landscape
    'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=800&q=80', // nature
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80', // portrait woman
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80', // portrait man
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80', // tech
    'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80', // abstract
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80', // forest
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80', // portrait face
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', // product watch
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80', // ocean
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80', // gaming
    'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=800&q=80', // northern lights
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80', // architecture
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80', // coffee
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80', // portrait close
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80', // mountain sunrise
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80', // fitness
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80', // coffee cup
    'https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=800&q=80', // basketball
    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80', // golden gate
    'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&q=80', // sunset person
    'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80', // food
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=800&q=80', // portrait man 2
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&q=80', // laptop code
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80', // workspace
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80', // neon city
    'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=80', // starry sky
    'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=800&q=80', // neon art
    'https://images.unsplash.com/photo-1535350356005-fd52b3b524fb?w=800&q=80', // mountains
    'https://images.unsplash.com/photo-1541185934-01b600ea069c?w=800&q=80', // sports car
  ];

  const promptTemplates = [
    {
      text: 'A cinematic wide shot of a futuristic cyberpunk city at night, neon lights reflecting on wet streets, flying cars in the distance, volumetric fog, ultra detailed, 8k resolution --ar 16:9 --v 6',
      tags: ['cinematic', 'sci-fi', 'landscape'],
      model: 'MIDJOURNEY' as AIModel,
    },
    {
      text: 'Professional portrait photography of a woman with natural curly hair, golden hour backlighting, soft bokeh background, studio quality, shot on Canon EOS R5 with 85mm f/1.2 lens',
      tags: ['portrait', 'photography', 'realistic'],
      model: 'FLUX' as AIModel,
    },
    {
      text: 'Epic fantasy landscape, majestic snow-capped mountains, ancient elven castle perched on a cliff, dramatic thunderstorm clouds, golden hour breaking through, concept art by Greg Rutkowski',
      tags: ['fantasy', 'landscape', 'cinematic'],
      model: 'SDXL' as AIModel,
    },
    {
      text: 'Hyper-realistic close-up portrait of an elderly fisherman, weathered skin with deep wrinkles, piercing blue eyes, salt-and-pepper beard, dramatic side lighting, National Geographic style',
      tags: ['portrait', 'photography', 'realistic'],
      model: 'FLUX' as AIModel,
    },
    {
      text: 'Luxury product photography of a gold chronograph watch on polished black marble surface, dramatic studio lighting with soft reflections, commercial campaign style, 4K',
      tags: ['product', 'photography', 'realistic'],
      model: 'STABLE_DIFFUSION' as AIModel,
    },
    {
      text: 'Abstract fluid art explosion, vibrant neon gradients of pink, purple and cyan, dynamic motion blur, modern digital art, perfect for wallpaper, 4k resolution',
      tags: ['abstract', 'cinematic'],
      model: 'DALLE' as AIModel,
    },
    {
      text: 'Photorealistic lion portrait in the African savanna at golden hour, mane flowing in the wind, intense gaze, shallow depth of field, wildlife photography, National Geographic award winner',
      tags: ['photography', 'realistic', 'portrait'],
      model: 'FLUX' as AIModel,
    },
    {
      text: 'Medieval fantasy knight in gleaming silver armor, standing before a burning castle, dramatic storm clouds, epic composition, cinematic lighting, digital painting by Artgerm --ar 2:3',
      tags: ['fantasy', 'portrait', 'cinematic'],
      model: 'MIDJOURNEY' as AIModel,
    },
    {
      text: 'Minimalist Scandinavian interior, floor-to-ceiling windows with morning light streaming in, clean lines, indoor plants, warm wood tones, architectural digest cover photo',
      tags: ['photography', 'realistic', 'product'],
      model: 'STABLE_DIFFUSION' as AIModel,
    },
    {
      text: 'Cute Pixar-style 3D character, a cheerful robot with big expressive eyes, holding a glowing flower, soft studio lighting, colorful, detailed textures, octane render',
      tags: ['anime', 'portrait', 'fantasy'],
      model: 'DALLE' as AIModel,
    },
    {
      text: 'Dramatic seascape with massive crashing waves against ancient sea cliffs, stormy sky with a break of golden sunlight, lighthouse in the distance, moody atmosphere, long exposure',
      tags: ['landscape', 'cinematic', 'photography'],
      model: 'SDXL' as AIModel,
    },
    {
      text: 'Steampunk airship flying through golden clouds at sunset, Victorian brass and copper aesthetics, intricate mechanical gears and steam vents, dieselpunk, matte painting --ar 16:9 --v 6',
      tags: ['fantasy', 'sci-fi', 'cinematic'],
      model: 'MIDJOURNEY' as AIModel,
    },
    {
      text: 'High fashion editorial portrait, woman with dramatic avant-garde makeup, bold geometric eyeshadow, studio ring light, Vogue Italia cover, shot by Mario Testino',
      tags: ['portrait', 'photography'],
      model: 'FLUX' as AIModel,
    },
    {
      text: 'Ancient Mayan temple ruins reclaimed by jungle, massive tree roots wrapping around stone columns, shafts of light piercing the canopy, mystical atmosphere, photorealistic',
      tags: ['fantasy', 'landscape'],
      model: 'STABLE_DIFFUSION' as AIModel,
    },
    {
      text: 'Cyberpunk female assassin, neon-lit rain-soaked alley, holographic tattoos, tactical stealth suit, cinematic close-up, blade runner meets ghost in the shell --ar 2:3 --style raw',
      tags: ['sci-fi', 'portrait', 'cinematic'],
      model: 'MIDJOURNEY' as AIModel,
    },
    {
      text: 'Minimalist product photography, matte black wireless earbuds on gradient peach background, soft shadows, clean composition, Apple-style commercial photography, 8K',
      tags: ['product', 'photography'],
      model: 'DALLE' as AIModel,
    },
    {
      text: 'Enchanted bioluminescent forest at midnight, giant glowing mushrooms, fireflies creating light trails, ethereal blue and green glow, fantasy illustration, matte painting',
      tags: ['fantasy', 'landscape'],
      model: 'SDXL' as AIModel,
    },
    {
      text: 'Street photography of Shibuya crossing Tokyo at night, neon signs reflecting in rain puddles, motion blur of crowds, cinematic teal and orange color grading, Fujifilm X100V',
      tags: ['photography', 'cinematic', 'realistic'],
      model: 'FLUX' as AIModel,
    },
    {
      text: 'Massive dragon perched on a volcanic mountain peak, wings spread wide against a blood-red sky, molten lava rivers below, epic scale, hyper-detailed scales and textures --ar 16:9',
      tags: ['fantasy', 'cinematic'],
      model: 'MIDJOURNEY' as AIModel,
    },
    {
      text: 'Cozy hygge coffee shop interior, rainy window view, warm candlelight, overflowing bookshelves, steaming latte art, autumn vibes, nostalgic film photography aesthetic',
      tags: ['photography', 'realistic', 'product'],
      model: 'STABLE_DIFFUSION' as AIModel,
    },
    {
      text: 'Astronaut floating in deep space, Earth reflected in visor, surrounded by cosmic nebula in vibrant purple and blue, hyperrealistic, NASA photography style, 8K',
      tags: ['sci-fi', 'cinematic', 'portrait'],
      model: 'MIDJOURNEY' as AIModel,
    },
    {
      text: 'Delicate macro photography of a dewdrop on a rose petal, prismatic light refraction, shallow depth of field, early morning garden, Canon 100mm macro lens, ethereal',
      tags: ['photography', 'realistic'],
      model: 'FLUX' as AIModel,
    },
    {
      text: 'Retro synthwave sunset cityscape, palm trees silhouetted against neon gradient sky, chrome reflections, 1980s aesthetic, outrun style, digital illustration',
      tags: ['abstract', 'landscape', 'cinematic'],
      model: 'SDXL' as AIModel,
    },
    {
      text: 'Hyperrealistic food photography, gourmet wagyu beef burger with melting cheese, brioche bun, studio lighting, dark moody background, Michelin star presentation',
      tags: ['product', 'photography', 'realistic'],
      model: 'DALLE' as AIModel,
    },
    {
      text: 'Underwater photography of a coral reef ecosystem, tropical fish, sunlight rays penetrating crystal clear water, marine biology, planet earth documentary style, 4K',
      tags: ['photography', 'landscape', 'realistic'],
      model: 'FLUX' as AIModel,
    },
    {
      text: 'Post-apocalyptic overgrown New York City, nature reclaiming skyscrapers, deer on 5th avenue, dramatic clouds, The Last of Us atmosphere, matte painting, concept art',
      tags: ['sci-fi', 'landscape', 'cinematic'],
      model: 'MIDJOURNEY' as AIModel,
    },
    {
      text: 'Elegant ballerina mid-leap, flowing white tutu, dramatic theatrical lighting against dark background, motion freeze, fine art photography, Annie Leibovitz style',
      tags: ['portrait', 'photography', 'cinematic'],
      model: 'FLUX' as AIModel,
    },
    {
      text: 'Isometric 3D render of a tiny cozy winter cabin in snowy forest, warm light from windows, smoke from chimney, miniature diorama, tilt-shift effect, cute and detailed',
      tags: ['fantasy', 'product'],
      model: 'DALLE' as AIModel,
    },
    {
      text: 'Dark moody portrait of a samurai warrior in traditional armor, katana drawn, cherry blossoms falling, dramatic rim lighting, cinematic color grading --ar 2:3 --style raw',
      tags: ['portrait', 'fantasy', 'cinematic'],
      model: 'MIDJOURNEY' as AIModel,
    },
    {
      text: 'Aerial drone photography of turquoise ocean meeting white sand beach, abstract patterns in the water, Maldives, travel photography, golden hour, DJI Mavic 3',
      tags: ['landscape', 'photography', 'abstract'],
      model: 'STABLE_DIFFUSION' as AIModel,
    },
  ];

  const aspectRatios = ['16:9', '9:16', '1:1', '4:3', '3:2', null];
  const authors = [
    { handle: 'artstation_daily', name: 'ArtStation Daily' },
    { handle: 'promptcraft', name: 'PromptCraft' },
    { handle: 'ai_dreamscape', name: 'AI Dreamscape' },
    { handle: 'midjourney_pro', name: 'MJ Professional' },
    { handle: 'flux_master', name: 'Flux Master' },
    { handle: 'sdxl_wizard', name: 'SDXL Wizard' },
    { handle: 'dalle_artist', name: 'DALL-E Artist' },
    { handle: 'prompt_engineer', name: 'Prompt Engineer' },
    { handle: 'ai_visionary', name: 'AI Visionary' },
    { handle: 'digital_dreams', name: 'Digital Dreams' },
  ];

  const prompts = [];
  const now = new Date();

  for (let i = 0; i < 60; i++) {
    const template = promptTemplates[i % promptTemplates.length];
    const author = authors[i % authors.length];
    const hoursAgo = Math.floor((72 / 60) * i);
    const createdAt = new Date(now);
    createdAt.setHours(createdAt.getHours() - hoursAgo);

    const likeCount = Math.floor(Math.random() * 5000) + 200;
    const repostCount = Math.floor(Math.random() * 1000) + 50;
    const replyCount = Math.floor(Math.random() * 300) + 20;
    const quoteCount = Math.floor(Math.random() * 150) + 10;
    const viralScore = likeCount + repostCount * 2 + replyCount * 1.5 + quoteCount * 2.5;

    prompts.push({
      tweetId: `seed_${2000000 + i}`,
      tweetUrl: i % 3 === 0
        ? `https://reddit.com/r/midjourney/comments/${2000000 + i}`
        : `https://twitter.com/${author.handle}/status/${2000000 + i}`,
      authorHandle: author.handle,
      authorName: author.name,
      createdAtX: createdAt,
      rawText: `${template.model} prompt: ${template.text}`,
      promptText: template.text,
      imageUrl: imageUrls[i % imageUrls.length],
      embedHtml: null,
      likeCount,
      repostCount,
      replyCount,
      quoteCount,
      viralScore,
      tags: template.tags,
      model: template.model,
      aspectRatio: aspectRatios[i % aspectRatios.length],
      status: 'PUBLISHED' as const,
    });
  }

  return prompts;
};

async function main() {
  console.log('Seeding comprehensive data with real images...');

  // Clear existing data
  await prisma.vote.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.promptPost.deleteMany();
  console.log('Cleared existing data');

  const prompts = generatePrompts();

  for (const prompt of prompts) {
    await prisma.promptPost.upsert({
      where: { tweetId: prompt.tweetId },
      create: prompt,
      update: prompt,
    });
  }

  console.log(`Created ${prompts.length} prompts with real images`);

  const modelCounts = prompts.reduce((acc, p) => {
    acc[p.model] = (acc[p.model] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(modelCounts).forEach(([model, count]) => {
    console.log(`   ${model}: ${count} prompts`);
  });

  console.log('Done! All prompts have real, working images.');
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
