# Environment Variables Template

Copy this to `.env` and fill in your values.

```env
# ==================================
# DATABASE
# ==================================
# PostgreSQL connection string
# Get from: Neon, Supabase, or local PostgreSQL
DATABASE_URL="postgresql://username:password@host:5432/bestphotoprompt?schema=public"

# ==================================
# NEXTAUTH
# ==================================
# Full URL of your site (no trailing slash)
# Local: http://localhost:3000
# Production: https://bestphotoprompt.com
NEXTAUTH_URL="http://localhost:3000"

# Random secret for NextAuth
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=""

# ==================================
# GITHUB OAUTH
# ==================================
# Get from: https://github.com/settings/developers
# Create new OAuth App with callback: {NEXTAUTH_URL}/api/auth/callback/github
GITHUB_ID=""
GITHUB_SECRET=""

# ==================================
# X (TWITTER) API
# ==================================
# Get from: https://developer.twitter.com/portal
# You need a Developer account (free tier works)
# Copy the Bearer Token from your App's "Keys and tokens" section
X_BEARER_TOKEN=""

# ==================================
# CRON PROTECTION
# ==================================
# Random secret to protect cron endpoints
# Generate with: openssl rand -hex 32
CRON_SECRET=""

# ==================================
# EMAIL (OPTIONAL - for magic link auth)
# ==================================
# Only needed if you want email magic link authentication
# Works with Gmail, SendGrid, Mailgun, AWS SES, etc.
# EMAIL_SERVER_HOST="smtp.gmail.com"
# EMAIL_SERVER_PORT="587"
# EMAIL_SERVER_USER="your-email@gmail.com"
# EMAIL_SERVER_PASSWORD="your-app-password"
# EMAIL_FROM="noreply@bestphotoprompt.com"
```

## Quick Setup Commands

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate CRON_SECRET
openssl rand -hex 32
```

## Required Services

### 1. Database (choose one)

**Neon (Recommended):**
- Sign up at https://neon.tech
- Create project
- Copy connection string

**Supabase:**
- Sign up at https://supabase.com
- Create project
- Use "Pooler" connection string

**Local PostgreSQL:**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb bestphotoprompt
# Use: postgresql://localhost:5432/bestphotoprompt
```

### 2. X API

1. Go to https://developer.twitter.com/portal
2. Sign up (free tier is fine)
3. Create an App
4. Go to "Keys and tokens"
5. Copy Bearer Token

**Rate Limits (Free Tier):**
- 10,000 tweets/month
- 50 requests per 15 min

### 3. GitHub OAuth

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Set:
   - Name: BestPhotoPrompt Local
   - URL: http://localhost:3000
   - Callback: http://localhost:3000/api/auth/callback/github
4. Copy Client ID and Secret

## Verification

Test your configuration:

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Test database connection
npx prisma db pull

# Start dev server
npm run dev
```

Visit http://localhost:3000 and you should see the feed (empty at first).

## Next Steps

1. Run ingestion manually to populate database:
   ```bash
   curl "http://localhost:3000/api/cron/ingest?secret=YOUR_CRON_SECRET"
   ```

2. Check health endpoint:
   ```bash
   curl http://localhost:3000/api/health
   ```

3. Test authentication by clicking "Sign In"

## Troubleshooting

**Can't connect to database:**
- Verify DATABASE_URL is correct
- Check database is running
- For cloud databases, check IP whitelist

**GitHub OAuth not working:**
- Verify callback URL matches exactly
- Check GITHUB_ID and GITHUB_SECRET
- Ensure NEXTAUTH_URL has no trailing slash

**X API errors:**
- Verify X_BEARER_TOKEN is correct
- Check you have API access enabled
- Free tier has limits (50 req/15min)

**Cron endpoint returns 401:**
- Check CRON_SECRET is set
- Pass it as: ?secret=YOUR_SECRET or Bearer token
