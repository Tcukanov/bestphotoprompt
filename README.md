# BestPhotoPrompt.com

A production-ready web app that automatically finds viral AI photo prompt posts on X (Twitter) daily, extracts the prompt text, and displays them in a Reddit-style feed where users can upvote/downvote.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (GitHub OAuth + Email Magic Link)
- **Automation**: Vercel Cron Jobs
- **APIs**: X (Twitter) API v2 + oEmbed
- **Deployment**: Vercel

## Features

- 📱 Daily automated ingestion of viral AI prompts from X
- 🎨 Clean grid feed with sorting (Trending, Top Week, Top All Time, New)
- 🔍 Filter by AI model (Midjourney, SDXL, Flux, Stable Diffusion)
- 👍 Reddit-style upvote/downvote system
- 📋 One-click prompt copying
- 🐦 Embedded tweet display with X oEmbed
- 🔐 User authentication (GitHub + Email magic link)
- 📊 Viral score calculation from X metrics
- 🏷️ Auto-detected tags and aspect ratios

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database (Neon, Supabase, or any Postgres)
DATABASE_URL="postgresql://user:password@host:5432/bestphotoprompt?schema=public"

# NextAuth
NEXTAUTH_URL="https://bestphotoprompt.com" # or http://localhost:3000 for dev
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# GitHub OAuth (https://github.com/settings/developers)
GITHUB_ID="your-github-oauth-app-client-id"
GITHUB_SECRET="your-github-oauth-app-client-secret"

# Email Provider (for magic links) - Optional, configure if using email auth
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@example.com"
EMAIL_SERVER_PASSWORD="your-email-password"
EMAIL_FROM="noreply@bestphotoprompt.com"

# X (Twitter) API v2 (https://developer.twitter.com/en/portal/dashboard)
X_BEARER_TOKEN="your-x-api-bearer-token"

# Cron Job Protection
CRON_SECRET="generate-random-secret-for-cron-protection"
```

### Generating Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate CRON_SECRET
openssl rand -hex 32
```

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or cloud)
- X API Bearer Token (from Twitter Developer Portal)
- GitHub OAuth App credentials

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/bestphotoprompt.git
cd bestphotoprompt
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create `.env` file with the variables listed above.

4. **Initialize database**

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for dev)
npm run db:push

# Or run migrations (for production)
npm run db:migrate
```

5. **Run development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses the following main tables:

- **User**: NextAuth user accounts
- **Account**: OAuth account information
- **Session**: User sessions
- **PromptPost**: AI prompt posts with tweet data
- **Vote**: User votes (upvotes/downvotes)
- **Bookmark**: User bookmarks (optional)

See `prisma/schema.prisma` for the complete schema.

## API Endpoints

### Public Endpoints

- `GET /api/prompts` - List prompts with filters and pagination
- `GET /api/prompts/[id]` - Get single prompt details
- `GET /api/health` - Health check endpoint

### Authenticated Endpoints

- `POST /api/vote` - Vote on a prompt
- `DELETE /api/vote?promptPostId={id}` - Remove vote

### Cron Endpoints (Protected with CRON_SECRET)

- `GET /api/cron/ingest` - Daily ingestion job (runs at 10:00 UTC)
- `GET /api/cron/refresh-metrics` - Refresh X metrics (runs every 6 hours)

## X API Setup

### Required Access

1. Sign up for X API access at [developer.twitter.com](https://developer.twitter.com)
2. Create a project and app
3. Get your **Bearer Token** (for API v2)
4. Set `X_BEARER_TOKEN` in your environment variables

### API Usage

The app uses:
- **X API v2 Recent Search** - Search for tweets with AI prompt keywords
- **X oEmbed API** - Fetch embeddable tweet HTML

Rate limits:
- Recent Search: 450 requests per 15 minutes (Essential access)
- oEmbed: No official limit, but implement delays between requests

## GitHub OAuth Setup

1. Go to [GitHub Settings > Developer Settings > OAuth Apps](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set callback URL to: `https://yourdomain.com/api/auth/callback/github`
4. Copy Client ID and Client Secret to your `.env`

## Deployment to Vercel

### Prerequisites

- GitHub account
- Vercel account (free tier works)
- PostgreSQL database (Neon or Supabase recommended)

### Steps

1. **Push code to GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/bestphotoprompt.git
git push -u origin main
```

2. **Deploy to Vercel**

- Go to [vercel.com](https://vercel.com)
- Click "Import Project"
- Select your GitHub repository
- Configure environment variables (all variables from `.env`)
- Deploy

3. **Run database migrations**

After first deployment:

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Link project
vercel link

# Run migrations in production
vercel env pull .env.production
DATABASE_URL="your-production-db-url" npx prisma migrate deploy
```

Or use the Vercel UI to run a one-time build command:
```bash
npx prisma migrate deploy && npm run build
```

4. **Verify Cron Jobs**

Cron jobs are configured in `vercel.json` and will automatically run on Vercel. To test manually:

```bash
curl -X GET "https://yourdomain.com/api/cron/ingest?secret=YOUR_CRON_SECRET"
```

### Post-Deployment Checklist

- [ ] Database is accessible from Vercel
- [ ] All environment variables are set
- [ ] GitHub OAuth callback URL is updated
- [ ] X API credentials are working
- [ ] Cron jobs are enabled (check Vercel dashboard > Cron)
- [ ] First ingestion ran successfully
- [ ] Authentication works
- [ ] Voting works

## Manual Ingestion

To manually trigger ingestion (useful for testing):

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://yourdomain.com/api/cron/ingest
```

## Project Structure

```
bestphotoprompt/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/  # NextAuth handlers
│   │   ├── cron/
│   │   │   ├── ingest/          # Daily ingestion job
│   │   │   └── refresh-metrics/ # Metrics refresh job
│   │   ├── prompts/             # Prompt list & detail
│   │   ├── vote/                # Voting endpoint
│   │   └── health/              # Health check
│   ├── auth/
│   │   ├── signin/              # Sign-in page
│   │   └── verify/              # Email verification page
│   ├── p/[id]/                  # Prompt detail page
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles
├── components/
│   ├── Header.tsx               # Navigation header
│   ├── FilterBar.tsx            # Sort & filter controls
│   ├── PromptFeed.tsx           # Feed container
│   ├── PromptCard.tsx           # Individual prompt card
│   ├── VoteButtons.tsx          # Upvote/downvote UI
│   ├── CopyButton.tsx           # Copy to clipboard
│   ├── TweetEmbed.tsx           # X tweet embed
│   ├── Pagination.tsx           # Pagination controls
│   └── Providers.tsx            # NextAuth provider
├── lib/
│   ├── prisma.ts                # Prisma client
│   ├── auth.ts                  # NextAuth config
│   ├── x-api.ts                 # X API integration
│   ├── types.ts                 # TypeScript types
│   └── utils.ts                 # Utility functions
├── prisma/
│   └── schema.prisma            # Database schema
├── vercel.json                  # Cron configuration
└── package.json
```

## Monitoring & Maintenance

### Health Check

Visit `/api/health` to check:
- Database connectivity
- Total prompt count
- API status

### Logs

View logs in Vercel dashboard:
- Functions > Select API route > View logs
- Check cron execution history

### Common Issues

**Cron not running:**
- Verify `CRON_SECRET` is set
- Check Vercel Cron is enabled
- View cron logs in Vercel dashboard

**X API errors:**
- Check `X_BEARER_TOKEN` is valid
- Verify API rate limits
- Check search queries are valid

**Database errors:**
- Verify `DATABASE_URL` is correct
- Check connection pooling settings
- Run `prisma migrate deploy`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - feel free to use this for your own projects!

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for solutions

---

Built with ❤️ using Next.js, Prisma, and X API
