# Deployment Guide

## Quick Start (Local Development)

### 1. Prerequisites

```bash
# Check Node.js version (need 18+)
node --version

# Check npm
npm --version
```

### 2. Database Setup

**Option A: Neon (Recommended)**

1. Go to [neon.tech](https://neon.tech)
2. Create a free account
3. Create a new project
4. Copy the connection string (starts with `postgresql://`)

**Option B: Supabase**

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Project Settings > Database
4. Copy the connection string (Pooler mode recommended)

**Option C: Local PostgreSQL**

```bash
# Install PostgreSQL
# macOS
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb bestphotoprompt
```

### 3. X API Setup

1. Go to [developer.twitter.com/portal](https://developer.twitter.com/en/portal/dashboard)
2. Sign up for Developer account (Free tier works)
3. Create a new App
4. Navigate to "Keys and tokens"
5. Copy the **Bearer Token**

**Important:** Free tier gives you:
- 10,000 tweets per month
- 50 requests per 15 minutes for search
- Sufficient for MVP

### 4. GitHub OAuth Setup

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: BestPhotoPrompt Local
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Copy **Client ID** and generate **Client Secret**

### 5. Environment Variables

Create `.env` file:

```env
# Database
DATABASE_URL="postgresql://username:password@host:5432/bestphotoprompt"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# GitHub OAuth
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"

# X API
X_BEARER_TOKEN="your-x-bearer-token"

# Cron
CRON_SECRET="your-cron-secret"

# Optional: Email (for magic links)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@bestphotoprompt.com"
```

Generate secrets:

```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# CRON_SECRET
openssl rand -hex 32
```

### 6. Install & Run

```bash
# Install dependencies
npm install

# Generate Prisma Client
npm run db:generate

# Push database schema
npm run db:push

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 7. Test Ingestion (Optional)

```bash
# Manually trigger ingestion
curl "http://localhost:3000/api/cron/ingest?secret=YOUR_CRON_SECRET"
```

---

## Production Deployment (Vercel)

### Step 1: Prepare Repository

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: BestPhotoPrompt MVP"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/bestphotoprompt.git
git branch -M main
git push -u origin main
```

### Step 2: Set Up Production Database

**Using Neon (Recommended):**

1. Create production project at [neon.tech](https://neon.tech)
2. Enable "Pooler" connection
3. Copy connection string with `?pgbouncer=true` suffix
4. Save for Vercel environment variables

**Using Supabase:**

1. Create production project
2. Go to Settings > Database
3. Use "Connection Pooling" string
4. Copy the pooled connection string

### Step 3: Update GitHub OAuth for Production

1. Go to your GitHub OAuth App settings
2. Update URLs:
   - **Homepage URL**: `https://bestphotoprompt.com`
   - **Callback URL**: `https://bestphotoprompt.com/api/auth/callback/github`
   
Or create a new OAuth App for production (recommended).

### Step 4: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." > "Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### Step 5: Add Environment Variables

In Vercel project settings, add all environment variables:

```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://bestphotoprompt.com
NEXTAUTH_SECRET=production-secret-here
GITHUB_ID=production-github-id
GITHUB_SECRET=production-github-secret
X_BEARER_TOKEN=your-bearer-token
CRON_SECRET=production-cron-secret
```

**Important:**
- Use different secrets for production
- Update `NEXTAUTH_URL` to your domain
- Use production GitHub OAuth credentials

### Step 6: Deploy

Click "Deploy" and wait for build to complete.

### Step 7: Run Database Migration

After first successful deployment:

**Option A: Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Pull environment variables
vercel env pull .env.production

# Run migration
npx prisma migrate deploy
```

**Option B: Vercel Dashboard**

1. Go to Project Settings > Environment Variables
2. Add temporary variable:
   - `SKIP_BUILD_STATIC_GENERATION=true`
3. Go to Deployments > Latest Deployment > "..." menu > "Redeploy"
4. Check deployment logs to verify Prisma migration

**Option C: Manual (Local)**

```bash
# Set DATABASE_URL to production database
DATABASE_URL="your-production-db-url" npx prisma migrate deploy
```

### Step 8: Verify Deployment

1. **Check Health Endpoint**
   ```bash
   curl https://bestphotoprompt.com/api/health
   ```

2. **Test Authentication**
   - Visit your site
   - Click "Sign In"
   - Test GitHub login

3. **Verify Cron Jobs**
   - Go to Vercel Dashboard > Project > Cron
   - You should see scheduled jobs listed
   - Manually trigger test:
     ```bash
     curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
       https://bestphotoprompt.com/api/cron/ingest
     ```

4. **Check Feed**
   - Visit homepage
   - Should see prompts after first ingestion

### Step 9: Custom Domain (Optional)

1. Go to Vercel Project Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` environment variable
5. Update GitHub OAuth callback URL

---

## Cron Jobs Configuration

Cron jobs are defined in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/ingest",
      "schedule": "0 10 * * *"
    },
    {
      "path": "/api/cron/refresh-metrics",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

- **Ingest**: Runs daily at 10:00 UTC
- **Refresh Metrics**: Runs every 6 hours

### Testing Cron Jobs

```bash
# Ingestion
curl -X GET "https://bestphotoprompt.com/api/cron/ingest" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Metrics refresh
curl -X GET "https://bestphotoprompt.com/api/cron/refresh-metrics" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Monitoring Cron Execution

1. Go to Vercel Dashboard
2. Select your project
3. Go to "Functions" tab
4. Filter by cron function names
5. View execution logs and errors

---

## Post-Deployment Checklist

- [ ] Database is accessible and migrated
- [ ] Health endpoint returns 200 OK
- [ ] Can sign in with GitHub
- [ ] Can view prompts feed
- [ ] Voting works (requires sign in)
- [ ] Copy button works
- [ ] Tweet embeds load correctly
- [ ] Cron jobs are scheduled
- [ ] Manual cron trigger works
- [ ] First ingestion completed successfully
- [ ] Filters work (sort, model, tags)
- [ ] Pagination works
- [ ] Individual prompt pages load
- [ ] Mobile responsive

---

## Troubleshooting

### Database Connection Issues

**Error: Can't reach database server**

1. Check `DATABASE_URL` is correct
2. Verify database is running
3. Check IP whitelist (for cloud databases)
4. For Vercel: Use connection pooling URL

**Solution:**
```bash
# Test connection locally
npx prisma db pull
```

### Prisma Migration Errors

**Error: Migrations not applied**

```bash
# Force deploy migrations
DATABASE_URL="your-db-url" npx prisma migrate deploy
```

**Error: Schema mismatch**

```bash
# Reset database (DEV ONLY!)
npx prisma migrate reset

# Production: manually apply
npx prisma migrate deploy
```

### X API Errors

**Error: Unauthorized (401)**

- Check `X_BEARER_TOKEN` is correct
- Verify API access level on Twitter Developer Portal

**Error: Rate limit exceeded (429)**

- Free tier: 50 requests per 15 minutes
- Reduce search queries or upgrade plan
- Implement longer delays between requests

### Cron Not Running

**Jobs not executing:**

1. Verify `vercel.json` is committed
2. Check Vercel Dashboard > Cron
3. Ensure `CRON_SECRET` is set
4. Check function logs for errors

**Unauthorized errors:**

- Verify cron routes check `Authorization: Bearer CRON_SECRET`
- Test with manual curl request

### GitHub OAuth Issues

**Error: Redirect URI mismatch**

1. Check GitHub OAuth settings
2. Verify callback URL matches exactly:
   - Local: `http://localhost:3000/api/auth/callback/github`
   - Production: `https://yourdomain.com/api/auth/callback/github`

### NextAuth Errors

**Error: No secret provided**

- Set `NEXTAUTH_SECRET` environment variable
- Regenerate with `openssl rand -base64 32`

**Error: NEXTAUTH_URL not defined**

- Set `NEXTAUTH_URL` to your site URL
- No trailing slash

---

## Performance Optimization

### Database Indexes

Already included in schema:
- `viralScore` (for trending sorts)
- `createdAtX` (for date sorting)
- `status` (for published filter)
- `model` (for model filter)
- `promptPostId` on votes (for counting)

### Caching Strategy

**Implement Redis caching (optional):**

```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

export async function getCachedPrompts(key: string) {
  return redis.get(key)
}

export async function setCachedPrompts(key: string, data: any, ttl = 300) {
  return redis.set(key, data, { ex: ttl })
}
```

### Image Optimization

- X oEmbed handles image optimization
- Use Next.js Image component if hosting images locally
- Consider CDN for static assets

---

## Scaling Considerations

### Database

**Current setup handles ~10K prompts well**

For scale:
1. Enable connection pooling (already recommended)
2. Add read replicas for heavy traffic
3. Consider PostgreSQL-specific optimizations:
   ```sql
   CREATE INDEX CONCURRENTLY idx_prompts_search ON "PromptPost" USING GIN (to_tsvector('english', "promptText"));
   ```

### Caching

**Add Redis for API responses:**
- Cache feed queries for 5 minutes
- Cache individual prompts for 1 hour
- Invalidate on new votes

### Rate Limiting

**Current: In-memory (single instance)**

For production:
1. Use Upstash Redis for distributed rate limiting
2. Implement per-user and per-IP limits
3. Add exponential backoff

### CDN

**Vercel automatically provides:**
- Edge caching
- CDN for static assets
- Automatic compression

---

## Monitoring

### Recommended Tools

1. **Vercel Analytics** (free)
   - Add to `app/layout.tsx`
   
2. **Prisma Studio** (dev)
   ```bash
   npx prisma studio
   ```

3. **Logging Service**
   - Logtail, Axiom, or Datadog
   - Forward Vercel logs

### Key Metrics to Monitor

- Cron job success rate
- API response times
- Database query performance
- X API rate limit usage
- User authentication success rate
- Vote/interaction rates

---

## Security Best Practices

✅ **Already implemented:**
- CSRF protection via NextAuth
- Rate limiting on vote endpoint
- Cron route protection with secret
- Input validation with Zod
- SQL injection prevention (Prisma)

**Additional recommendations:**
1. Enable Vercel's WAF (Enterprise)
2. Implement stricter CORS policies
3. Add webhook signature verification
4. Monitor for suspicious voting patterns
5. Implement account verification

---

## Backup Strategy

### Database Backups

**Neon:**
- Automatic daily backups (Pro plan)
- Point-in-time recovery

**Supabase:**
- Automatic daily backups
- Manual backup via Dashboard

**Manual backup:**
```bash
# Export data
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Code Backups

- GitHub repository (already done)
- Tag releases: `git tag v1.0.0`
- Keep production branch separate

---

## Future Enhancements

**Phase 2 Ideas:**
- User-submitted prompts
- Comments on prompts
- Bookmark/save feature (schema already exists)
- Email notifications for trending prompts
- API for developers
- Export prompts to CSV
- Prompt collections/playlists
- Advanced search with Algolia
- AI-powered prompt suggestions
- Discord/Slack integration

**Nice to have:**
- Dark mode toggle (currently auto)
- Keyboard shortcuts
- PWA support
- Internationalization
- A/B testing framework

---

Need help? Open an issue on GitHub or check the main README.
