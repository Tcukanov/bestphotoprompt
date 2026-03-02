# Quick Start Guide

Get BestPhotoPrompt running in 10 minutes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (cloud or local)
- X API Bearer Token
- GitHub OAuth App credentials

Don't have these? See [DEPLOYMENT.md](DEPLOYMENT.md) for setup instructions.

## 1. Clone & Install (2 min)

```bash
cd /Users/mustafa/Documents/bestphotoprompt
npm install
```

## 2. Set Up Database (2 min)

**Option A: Neon (Recommended)**
1. Sign up at https://neon.tech
2. Create project
3. Copy connection string

**Option B: Local PostgreSQL**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb bestphotoprompt
# Connection string: postgresql://localhost:5432/bestphotoprompt
```

## 3. Get API Keys (3 min)

**X API Token:**
1. Visit https://developer.twitter.com/portal
2. Create App
3. Copy Bearer Token from "Keys and tokens"

**GitHub OAuth:**
1. Visit https://github.com/settings/developers
2. New OAuth App:
   - Name: BestPhotoPrompt Local
   - URL: http://localhost:3000
   - Callback: http://localhost:3000/api/auth/callback/github
3. Copy Client ID and Secret

## 4. Configure Environment (1 min)

Create `.env`:

```env
DATABASE_URL="your-database-url-here"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"
X_BEARER_TOKEN="your-x-bearer-token"
CRON_SECRET="$(openssl rand -hex 32)"
```

Replace placeholders with your actual values.

## 5. Initialize Database (1 min)

```bash
npm run db:generate
npm run db:push
```

## 6. Start Development Server (1 min)

```bash
npm run dev
```

Visit http://localhost:3000 🎉

## 7. Populate with Data (Optional)

```bash
curl "http://localhost:3000/api/cron/ingest?secret=YOUR_CRON_SECRET"
```

Wait ~30 seconds, refresh page to see prompts.

---

## Verify Everything Works

### Health Check
```bash
curl http://localhost:3000/api/health
```

Expected: `{"status":"healthy",...}`

### Sign In
1. Click "Sign In" button
2. Choose GitHub
3. Authorize app
4. You should be signed in

### Test Voting
1. Click upvote on any prompt
2. Score should increase
3. Button turns blue

### Copy Prompt
1. Click "Copy" button
2. Paste somewhere
3. Full prompt text should be copied

---

## Common Issues

### "Can't reach database"
- Check DATABASE_URL is correct
- Verify database is running
- For cloud: check IP whitelist

### "X API unauthorized"
- Verify X_BEARER_TOKEN
- Check token isn't expired
- Ensure API access is enabled

### "GitHub OAuth error"
- Verify callback URL matches exactly
- Check GITHUB_ID and GITHUB_SECRET
- Ensure NEXTAUTH_URL has no trailing slash

### "No prompts showing"
- Run ingestion manually (step 7)
- Check X API rate limits
- View console logs for errors

---

## Next Steps

### Customize
- Edit colors in `tailwind.config.ts`
- Modify filters in `components/FilterBar.tsx`
- Adjust cron schedule in `vercel.json`

### Deploy to Production
See [DEPLOYMENT.md](DEPLOYMENT.md) for full guide.

Quick version:
```bash
git init
git add .
git commit -m "Initial commit"
git push -u origin main
# Deploy on Vercel dashboard
```

### Add Features
- User profiles
- Comments on prompts
- Bookmark system (schema already exists)
- Advanced search
- Email notifications

---

## File Structure Reference

```
app/
├── api/              # API routes
│   ├── auth/         # NextAuth
│   ├── cron/         # Scheduled jobs
│   ├── prompts/      # Prompt endpoints
│   └── vote/         # Voting
├── auth/             # Auth pages
├── p/[id]/           # Prompt detail
└── page.tsx          # Home feed

components/
├── Header.tsx        # Nav
├── PromptFeed.tsx    # Feed
├── PromptCard.tsx    # Card
└── VoteButtons.tsx   # Voting UI

lib/
├── prisma.ts         # DB client
├── auth.ts           # Auth config
├── x-api.ts          # X integration
└── utils.ts          # Helpers

prisma/
└── schema.prisma     # Database schema
```

---

## Key Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema (dev)
npm run db:migrate       # Run migrations (prod)
npm run db:studio        # Open Prisma Studio

# Testing
curl localhost:3000/api/health                    # Health check
curl "localhost:3000/api/cron/ingest?secret=..."  # Manual ingest
curl localhost:3000/api/prompts                   # List prompts
```

---

## Environment Variables Checklist

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `NEXTAUTH_URL` - Your site URL (no trailing slash)
- [ ] `NEXTAUTH_SECRET` - Random secret (32+ chars)
- [ ] `GITHUB_ID` - GitHub OAuth Client ID
- [ ] `GITHUB_SECRET` - GitHub OAuth Client Secret
- [ ] `X_BEARER_TOKEN` - X API Bearer Token
- [ ] `CRON_SECRET` - Random secret for cron protection

Optional:
- [ ] `EMAIL_SERVER_*` - For magic link auth
- [ ] `EMAIL_FROM` - Sender email address

---

## API Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/health` | GET | Health check | - |
| `/api/prompts` | GET | List prompts | Optional |
| `/api/prompts/[id]` | GET | Get prompt | Optional |
| `/api/vote` | POST | Vote | Required |
| `/api/cron/ingest` | GET | Ingest tweets | Secret |

---

## Support

**Documentation:**
- [README.md](README.md) - Overview
- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment
- [TESTING.md](TESTING.md) - Testing guide
- [FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md) - Architecture

**Issues:**
- Check existing docs first
- Review console logs
- Check database with Prisma Studio
- Create GitHub issue if needed

---

## Pro Tips

1. **Use Prisma Studio** to inspect database:
   ```bash
   npm run db:studio
   ```

2. **Check logs** when debugging:
   - Browser console (F12)
   - Terminal where `npm run dev` is running
   - Vercel function logs (production)

3. **Test API directly** with curl before debugging UI

4. **Rate limits** - X API free tier:
   - 50 requests / 15 min
   - 10,000 tweets / month
   - Plan accordingly

5. **Local development** - Use separate GitHub OAuth app from production

---

Ready to build? Start with step 1! 🚀

Questions? Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed guides.
