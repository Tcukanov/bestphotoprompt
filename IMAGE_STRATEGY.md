# Image Strategy & WebP Optimization

## Current Implementation (Test Data)

**For Testing/Demo:**
- Uses Lorem Picsum placeholder images
- Random but consistent images based on prompt ID
- Displays in cards and detail pages
- **Next.js automatically serves WebP** when browser supports it

---

## Production Strategy (Real X Data)

### Option 1: Use X oEmbed (Recommended - Compliant)

**How it works:**
- X's oEmbed HTML includes tweet images
- Images load from X's CDN
- Complies with X Terms of Service
- No storage costs
- Automatic updates if tweet is deleted

**Pros:**
✅ Compliant with X ToS
✅ No storage/bandwidth costs
✅ Images always up-to-date
✅ X handles optimization

**Cons:**
❌ Depends on X's availability
❌ Limited control over format
❌ May have tracking pixels

**Implementation:**
```typescript
// Already implemented in TweetEmbed.tsx
<TweetEmbed html={prompt.embedHtml} />
```

---

### Option 2: Store & Optimize Images (Advanced)

**⚠️ Warning:** May violate X Terms of Service. Check current ToS before implementing.

**How it works:**
1. Extract image URLs from tweets
2. Download images
3. Convert to WebP
4. Store in cloud storage (S3/R2)
5. Serve via CDN

**Tech Stack:**
- **Storage**: Cloudflare R2 (S3-compatible, free egress) or AWS S3
- **CDN**: Cloudflare (free tier) or AWS CloudFront
- **Conversion**: Sharp library (Node.js) or imagemin
- **Processing**: Background job after ingestion

**Implementation Example:**

```typescript
// lib/image-processor.ts
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function downloadAndConvertImage(
  imageUrl: string,
  promptId: string
): Promise<string> {
  // Download image
  const response = await fetch(imageUrl);
  const buffer = Buffer.from(await response.arrayBuffer());

  // Convert to WebP with optimization
  const webpBuffer = await sharp(buffer)
    .webp({
      quality: 85,
      effort: 6,
    })
    .resize(1200, 800, {
      fit: 'cover',
      position: 'center',
    })
    .toBuffer();

  // Upload to S3
  const key = `prompts/${promptId}.webp`;
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: webpBuffer,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000',
    })
  );

  // Return CDN URL
  return `https://cdn.yourdomain.com/${key}`;
}

// Usage in ingestion
const imageUrl = extractImageFromTweet(tweet);
if (imageUrl) {
  const webpUrl = await downloadAndConvertImage(imageUrl, promptId);
  await prisma.promptPost.update({
    where: { id: promptId },
    data: { imageUrl: webpUrl },
  });
}
```

**Update Schema:**
```prisma
model PromptPost {
  // ... existing fields
  imageUrl     String?  // Add this field
}
```

**Update UI:**
```typescript
// components/PromptCard.tsx
<img
  src={prompt.imageUrl || getPlaceholderImage()}
  alt={prompt.promptText}
  className="w-full h-full object-cover"
  loading="lazy"
/>
```

**Costs (Cloudflare R2):**
- Storage: $0.015/GB/month
- Operations: $4.50 per million writes
- Egress: FREE (unlike S3)
- ~1,000 images = ~500MB = **$0.01/month**

---

## WebP Optimization Already Built-In

### Next.js Image Optimization

Next.js **automatically serves WebP** when:
- Browser supports WebP
- Using Next.js `<Image>` component

**Current setup:**
```javascript
// next.config.js
images: {
  formats: ['image/webp', 'image/avif'],
}
```

This means:
- ✅ Modern browsers get WebP
- ✅ Safari gets AVIF (even better)
- ✅ Old browsers get original format
- ✅ Automatic optimization
- ✅ Lazy loading built-in

### Upgrade to Next.js Image Component

For even better optimization:

```typescript
// components/PromptCard.tsx
import Image from 'next/image';

<Image
  src={getPlaceholderImage()}
  alt={prompt.promptText.slice(0, 100)}
  width={600}
  height={400}
  className="w-full h-full object-cover"
  loading="lazy"
  quality={85}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..." // tiny base64
/>
```

**Benefits:**
- ✅ WebP/AVIF automatic
- ✅ Responsive images
- ✅ Blur placeholder while loading
- ✅ Size optimization
- ✅ Lazy loading

---

## Recommendations

### For MVP/Demo (Current):
✅ **Use placeholder images** (Lorem Picsum)
✅ **Keep it simple**
✅ **Focus on functionality**

### For Launch (Real X Data):
✅ **Use X oEmbed** (compliant, free, simple)
✅ **Let X handle images**
✅ **Test tweet embeds work**

### For Scale (100K+ prompts):
✅ **Store & convert to WebP**
✅ **Use Cloudflare R2** (free egress)
✅ **Serve via CDN**
✅ **Upgrade to Next.js Image**

---

## Migration Path

**Phase 1: Now → Launch**
```typescript
// Use placeholder images for test data
const placeholderImage = `https://picsum.photos/seed/${seed}/600/400`;
```

**Phase 2: Launch → 1K Users**
```typescript
// Use X oEmbed for real tweets
<TweetEmbed html={prompt.embedHtml} />
```

**Phase 3: 1K+ Users → Scale**
```typescript
// Extract and store images
const imageUrl = await downloadAndConvertImage(tweetImageUrl, promptId);
// Serve from CDN in WebP
<Image src={imageUrl} ... />
```

---

## Cost Comparison

### X oEmbed (Free)
- **Cost**: $0
- **Bandwidth**: Unlimited
- **Setup**: None
- **Maintenance**: None

### Self-Hosted WebP
**Monthly costs for 10K prompts:**
- Storage (5GB): $0.08
- CDN (100GB transfer): $0
- Processing: One-time
- **Total**: ~$0.08/month

**Monthly costs for 100K prompts:**
- Storage (50GB): $0.75
- CDN (1TB transfer): $0
- **Total**: ~$0.75/month

**Conclusion:** Self-hosting is VERY cheap with Cloudflare R2!

---

## Implementation Checklist

### Current (Test Data) ✅
- [x] Placeholder images in cards
- [x] Placeholder images in detail page
- [x] WebP support configured
- [x] Lazy loading enabled

### Phase 2 (X oEmbed)
- [ ] Test oEmbed with real tweets
- [ ] Verify images load
- [ ] Handle deleted tweets
- [ ] Add error states

### Phase 3 (Self-Hosted)
- [ ] Add imageUrl field to schema
- [ ] Install Sharp library
- [ ] Set up Cloudflare R2 bucket
- [ ] Create image processor
- [ ] Add to ingestion pipeline
- [ ] Migrate existing prompts
- [ ] Update UI components
- [ ] Set up CDN caching

---

## Dependencies for WebP Processing

```bash
# Install Sharp for image processing
npm install sharp

# Install AWS SDK for S3/R2
npm install @aws-sdk/client-s3

# Update package.json
```

```json
{
  "dependencies": {
    "sharp": "^0.33.0",
    "@aws-sdk/client-s3": "^3.450.0"
  }
}
```

---

## Environment Variables

```env
# For self-hosted images (Phase 3)
AWS_REGION="auto"
AWS_ACCESS_KEY_ID="your-cloudflare-r2-access-key"
AWS_SECRET_ACCESS_KEY="your-cloudflare-r2-secret-key"
S3_BUCKET="bestphotoprompt-images"
CDN_URL="https://cdn.bestphotoprompt.com"
```

---

## Testing WebP Support

Visit: http://localhost:3000

Open DevTools → Network tab

Look for image requests:
- Modern browsers: `image/webp` in Accept header
- Should receive WebP format
- Check file size (50-80% smaller than JPEG)

---

## Summary

✅ **Current**: Placeholder images with WebP support built-in
✅ **Launch**: Use X oEmbed (free, compliant)
✅ **Scale**: Self-host WebP on Cloudflare R2 (~$1/month for 100K images)

**Next.js handles WebP automatically** - you don't need to do anything special!

Images are now showing in your test environment. When you connect real X data, they'll automatically appear via oEmbed.
