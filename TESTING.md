# Testing Guide

### Manual Testing Checklist

### Local Development Tests

#### 1. Database Connection
```bash
# Test Prisma connection
npx prisma db pull

# Open Prisma Studio
npm run db:studio
```

Expected: No errors, Prisma Studio opens at http://localhost:5555

#### 2. Health Check
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "promptCount": 0
}
```

#### 3. Ingestion (Manual Trigger)
```bash
curl "http://localhost:3000/api/cron/ingest?secret=YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "processed": 50,
  "saved": 10,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Check:
- [ ] No errors in console
- [ ] Database has new records
- [ ] Logs show tweet processing

#### 4. List Prompts
```bash
curl http://localhost:3000/api/prompts
```

Expected response:
```json
{
  "prompts": [...],
  "total": 10,
  "page": 1,
  "limit": 24,
  "totalPages": 1
}
```

#### 5. Get Single Prompt
```bash
# Replace {id} with actual prompt ID from database
curl http://localhost:3000/api/prompts/{id}
```

Expected: Prompt object with all fields

#### 6. Authentication

**GitHub OAuth:**
1. Visit http://localhost:3000
2. Click "Sign In"
3. Click "Continue with GitHub"
4. Authorize app
5. Redirected back, signed in

**Email Magic Link:**
1. Click "Or continue with email"
2. Enter email
3. Check email inbox
4. Click magic link
5. Signed in

Check:
- [ ] User record created in database
- [ ] Session cookie set
- [ ] Header shows user info
- [ ] "Sign Out" button appears

#### 7. Voting

Prerequisites: Must be signed in

```bash
# Get session cookie from browser dev tools, or use browser

# Upvote
curl -X POST http://localhost:3000/api/vote \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"promptPostId": "prompt-id", "value": 1}'

# Expected response
{
  "success": true,
  "siteScore": 1,
  "userVote": 1
}

# Downvote
curl -X POST http://localhost:3000/api/vote \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"promptPostId": "prompt-id", "value": -1}'

# Remove vote
curl -X DELETE "http://localhost:3000/api/vote?promptPostId=prompt-id" \
  -H "Cookie: your-session-cookie"
```

In browser:
- [ ] Upvote button turns blue when clicked
- [ ] Score updates immediately
- [ ] Downvote button turns red when clicked
- [ ] Can toggle vote on/off
- [ ] Vote persists after refresh

#### 8. Copy Button
1. Click "Copy" button on any prompt
2. Paste in text editor

Check:
- [ ] Full prompt text is copied
- [ ] Button shows "✓ Copied" briefly
- [ ] Toast notification appears

#### 9. Filters

Test each filter:

**Sort:**
- [ ] Trending (24h) - shows recent high-score prompts
- [ ] Top Week - shows weekly top prompts
- [ ] Top All Time - shows all-time top
- [ ] New - shows newest first

**Model:**
- [ ] All Models - shows everything
- [ ] Midjourney - filters to MJ only
- [ ] Flux - filters to Flux only
- [ ] SDXL - filters to SDXL only

**Tags:**
- [ ] All Tags - no filter
- [ ] Cinematic - filters to cinematic
- [ ] Portrait - filters to portrait
- etc.

#### 10. Pagination

Prerequisites: Have 25+ prompts in database

- [ ] Shows correct page numbers
- [ ] "Next" button works
- [ ] "Previous" button works
- [ ] Direct page buttons work
- [ ] URL updates with page number
- [ ] Can refresh and stay on same page

#### 11. Tweet Embeds

1. Click "Show original tweet" on a card
2. Wait for embed to load

Check:
- [ ] Tweet displays correctly
- [ ] Images load
- [ ] Can click to view on X
- [ ] "Hide" button works

#### 12. Prompt Detail Page

1. Click on a prompt to view detail page

Check:
- [ ] Prompt text displays fully
- [ ] Copy button works
- [ ] Vote buttons work
- [ ] Stats show correct numbers
- [ ] Tags display
- [ ] Model badge shows
- [ ] Tweet embed loads
- [ ] "Back to feed" link works

#### 13. Responsive Design

Test on different screen sizes:

**Mobile (375px):**
- [ ] Header stacks properly
- [ ] Cards stack vertically
- [ ] Filters are usable
- [ ] Voting buttons accessible
- [ ] Text readable

**Tablet (768px):**
- [ ] 2-column grid
- [ ] Filters in row
- [ ] All features work

**Desktop (1440px):**
- [ ] 3-column grid
- [ ] Proper spacing
- [ ] Comfortable reading

#### 14. Dark Mode

Toggle system dark mode:

- [ ] Colors adjust appropriately
- [ ] Text readable in both modes
- [ ] No white flashes
- [ ] Borders visible
- [ ] Tweet embeds work in both

---

## Production Tests (Post-Deployment)

### Deployment Verification

#### 1. Health Check
```bash
curl https://bestphotoprompt.com/api/health
```

Expected: 200 OK with healthy status

#### 2. Cron Jobs

Check Vercel Dashboard:
- [ ] Cron jobs are listed
- [ ] Schedule is correct
- [ ] No failed executions

Manual trigger:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://bestphotoprompt.com/api/cron/ingest
```

#### 3. Database Connection
- [ ] Migrations applied
- [ ] Tables exist
- [ ] Can query data

#### 4. Authentication

**GitHub OAuth:**
- [ ] Callback URL is correct
- [ ] Can sign in
- [ ] Session persists

**Email (if enabled):**
- [ ] Can request magic link
- [ ] Email is received
- [ ] Link works
- [ ] Can sign in

#### 5. API Performance

Test response times:
```bash
# List prompts
time curl https://bestphotoprompt.com/api/prompts

# Get single prompt
time curl https://bestphotoprompt.com/api/prompts/{id}
```

Expected:
- List: < 500ms
- Single: < 200ms
- Health: < 100ms

#### 6. Security Headers

```bash
curl -I https://bestphotoprompt.com
```

Check for:
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Strict-Transport-Security (HTTPS)

#### 7. Rate Limiting

Rapid requests test:
```bash
# Send 100 requests quickly
for i in {1..100}; do
  curl -X POST https://bestphotoprompt.com/api/vote \
    -H "Content-Type: application/json" \
    -d '{"promptPostId": "test", "value": 1}' &
done
```

Expected:
- [ ] Some requests return 429 (Too Many Requests)
- [ ] Server doesn't crash
- [ ] Rate limit resets after window

#### 8. Load Test (Optional)

Use tool like `hey` or `ab`:

```bash
# Install hey
go install github.com/rakyll/hey@latest

# Test with 100 requests, 10 concurrent
hey -n 100 -c 10 https://bestphotoprompt.com/api/prompts
```

Expected:
- [ ] No 500 errors
- [ ] Average response < 1s
- [ ] All requests complete

---

## Error Scenarios

### Test Error Handling

#### 1. Invalid Vote Request
```bash
curl -X POST http://localhost:3000/api/vote \
  -H "Content-Type: application/json" \
  -d '{"promptPostId": "invalid", "value": 99}'
```

Expected: 400 Bad Request with validation error

#### 2. Unauthorized Vote
```bash
# Without session cookie
curl -X POST http://localhost:3000/api/vote \
  -H "Content-Type: application/json" \
  -d '{"promptPostId": "test", "value": 1}'
```

Expected: 401 Unauthorized

#### 3. Non-existent Prompt
```bash
curl http://localhost:3000/api/prompts/non-existent-id
```

Expected: 404 Not Found

#### 4. Invalid Cron Secret
```bash
curl "http://localhost:3000/api/cron/ingest?secret=wrong"
```

Expected: 401 Unauthorized

#### 5. Database Down

Stop database, then:
```bash
curl http://localhost:3000/api/health
```

Expected: 500 Internal Server Error with "unhealthy" status

---

## X API Testing

### Test X API Integration

#### 1. Search Tweets
```typescript
// In lib/x-api.ts, add test function
export async function testSearch() {
  const results = await searchRecentTweets('Midjourney prompt', 10);
  console.log(`Found ${results.data?.length || 0} tweets`);
  return results;
}
```

Run:
```bash
node -e "require('./lib/x-api').testSearch()"
```

#### 2. Get oEmbed
```typescript
export async function testOEmbed() {
  const result = await getTweetOEmbed(
    'https://twitter.com/username/status/1234567890'
  );
  console.log('oEmbed HTML length:', result.html.length);
  return result;
}
```

#### 3. Rate Limit Check

Monitor X API responses for rate limit headers:
```
x-rate-limit-limit
x-rate-limit-remaining
x-rate-limit-reset
```

---

## Database Testing

### Verify Data Integrity

#### 1. Duplicate Tweets
```sql
-- Should return 0 rows
SELECT "tweetId", COUNT(*)
FROM "PromptPost"
GROUP BY "tweetId"
HAVING COUNT(*) > 1;
```

#### 2. Orphaned Votes
```sql
-- Should return 0 rows
SELECT v.*
FROM "Vote" v
LEFT JOIN "PromptPost" p ON v."promptPostId" = p.id
WHERE p.id IS NULL;
```

#### 3. Vote Integrity
```sql
-- Check vote values are only 1 or -1
SELECT *
FROM "Vote"
WHERE value NOT IN (1, -1);
```

#### 4. Index Usage
```sql
-- Check indexes are being used
EXPLAIN ANALYZE
SELECT * FROM "PromptPost"
WHERE status = 'PUBLISHED'
ORDER BY "viralScore" DESC
LIMIT 24;
```

Expected: Uses index on viralScore

---

## Performance Testing

### Monitor Key Metrics

#### 1. API Response Times

Create monitoring endpoint:
```typescript
// app/api/metrics/route.ts
export async function GET() {
  const start = Date.now();
  
  // Test database
  const dbStart = Date.now();
  await prisma.promptPost.count();
  const dbTime = Date.now() - dbStart;
  
  return NextResponse.json({
    totalTime: Date.now() - start,
    dbTime,
  });
}
```

#### 2. Database Query Performance
```bash
# Enable query logging
DATABASE_URL="..." npx prisma studio
# Monitor slow queries (> 100ms)
```

#### 3. Memory Usage

Check Vercel function logs for memory usage

---

## Automated Testing (Optional)

### Example Jest Tests

```typescript
// __tests__/api/prompts.test.ts
import { GET } from '@/app/api/prompts/route';

describe('/api/prompts', () => {
  it('returns prompts', async () => {
    const req = new Request('http://localhost:3000/api/prompts');
    const response = await GET(req);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('prompts');
    expect(Array.isArray(data.prompts)).toBe(true);
  });
});
```

### Example E2E Tests (Playwright)

```typescript
// e2e/voting.spec.ts
import { test, expect } from '@playwright/test';

test('user can vote on prompt', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('text=Sign In');
  // ... authenticate
  await page.click('[data-testid="upvote-button"]');
  await expect(page.locator('[data-testid="score"]')).toContainText('1');
});
```

---

## Monitoring Setup

### Set Up Alerts

1. **Vercel Monitoring:**
   - Enable Vercel Analytics
   - Set up deployment notifications

2. **Database Monitoring:**
   - Monitor connection count
   - Track slow queries
   - Alert on high CPU

3. **Cron Monitoring:**
   - Alert on failed executions
   - Monitor execution time
   - Track ingestion success rate

4. **API Monitoring:**
   - Track error rates
   - Monitor response times
   - Alert on 500 errors

---

## Common Issues & Solutions

### Issue: No prompts after ingestion

**Check:**
```bash
# View ingestion logs
curl "http://localhost:3000/api/cron/ingest?secret=SECRET" | jq

# Check database
npx prisma studio

# Verify X API token
echo $X_BEARER_TOKEN
```

### Issue: Votes not persisting

**Check:**
```sql
SELECT * FROM "Vote" LIMIT 10;
SELECT * FROM "User" LIMIT 10;
```

**Solution:** Ensure user is authenticated and session is valid

### Issue: Tweet embeds not loading

**Check:**
- Browser console for errors
- Network tab for failed requests
- oEmbed HTML in database

**Solution:** Verify X oEmbed endpoint is accessible

---

## Test Data Setup

### Create Test Data

```typescript
// scripts/seed.ts
import { prisma } from './lib/prisma';

async function seed() {
  await prisma.promptPost.create({
    data: {
      tweetId: 'test123',
      tweetUrl: 'https://twitter.com/test/status/123',
      authorHandle: 'testuser',
      authorName: 'Test User',
      createdAtX: new Date(),
      rawText: 'Test prompt: Midjourney prompt here',
      promptText: 'Test prompt here',
      likeCount: 100,
      repostCount: 50,
      replyCount: 10,
      quoteCount: 5,
      viralScore: 275,
      tags: ['cinematic', 'portrait'],
      model: 'MIDJOURNEY',
      status: 'PUBLISHED',
    },
  });
}

seed();
```

Run:
```bash
npx ts-node scripts/seed.ts
```

---

## Pre-Launch Checklist

Before going live:

- [ ] All tests pass
- [ ] No console errors
- [ ] Database indexed properly
- [ ] Cron jobs scheduled
- [ ] Rate limiting works
- [ ] Authentication flows work
- [ ] Mobile responsive
- [ ] Performance acceptable
- [ ] Security headers set
- [ ] Environment variables set
- [ ] Error handling tested
- [ ] Monitoring configured

---

Happy testing! 🚀
