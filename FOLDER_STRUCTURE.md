# Project Folder Structure

```
bestphotoprompt/
│
├── app/                          # Next.js 14 App Router
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts      # NextAuth handlers (GET, POST)
│   │   ├── cron/
│   │   │   ├── ingest/
│   │   │   │   └── route.ts      # Daily ingestion job (protected)
│   │   │   └── refresh-metrics/
│   │   │       └── route.ts      # Metrics refresh job (protected)
│   │   ├── prompts/
│   │   │   ├── route.ts          # GET: List prompts with filters
│   │   │   └── [id]/
│   │   │       └── route.ts      # GET: Single prompt detail
│   │   ├── vote/
│   │   │   └── route.ts          # POST: Vote, DELETE: Unvote
│   │   └── health/
│   │       └── route.ts          # GET: Health check
│   │
│   ├── auth/                     # Authentication Pages
│   │   ├── signin/
│   │   │   └── page.tsx          # Sign-in page
│   │   └── verify/
│   │       └── page.tsx          # Email verification page
│   │
│   ├── p/                        # Prompt Pages
│   │   └── [id]/
│   │       └── page.tsx          # Individual prompt detail page
│   │
│   ├── layout.tsx                # Root layout (Header, Providers)
│   ├── page.tsx                  # Home page (Feed)
│   └── globals.css               # Global CSS + Tailwind
│
├── components/                   # React Components
│   ├── Header.tsx                # Navigation header with auth
│   ├── Providers.tsx             # NextAuth SessionProvider
│   ├── FilterBar.tsx             # Sort & filter controls
│   ├── PromptFeed.tsx            # Feed container with loading
│   ├── PromptCard.tsx            # Individual prompt card
│   ├── VoteButtons.tsx           # Upvote/downvote UI
│   ├── CopyButton.tsx            # Copy prompt to clipboard
│   ├── TweetEmbed.tsx            # X tweet embed component
│   └── Pagination.tsx            # Pagination controls
│
├── lib/                          # Utility Libraries
│   ├── prisma.ts                 # Prisma client singleton
│   ├── auth.ts                   # NextAuth configuration
│   ├── x-api.ts                  # X API integration (search, oEmbed, etc.)
│   ├── types.ts                  # TypeScript type definitions
│   └── utils.ts                  # Helper functions (formatting, rate limiting)
│
├── prisma/                       # Database
│   └── schema.prisma             # Database schema (User, PromptPost, Vote, etc.)
│
├── types/                        # Type Declarations
│   └── next-auth.d.ts            # NextAuth module augmentation
│
├── vercel.json                   # Vercel configuration (cron jobs)
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── postcss.config.js             # PostCSS configuration
├── package.json                  # Dependencies and scripts
│
├── .gitignore                    # Git ignore rules
├── README.md                     # Main documentation
├── DEPLOYMENT.md                 # Detailed deployment guide
├── ENV_TEMPLATE.md               # Environment variables template
└── FOLDER_STRUCTURE.md           # This file
```

## Key Files Explained

### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Node dependencies, scripts |
| `tsconfig.json` | TypeScript compiler options |
| `next.config.js` | Next.js config (image domains) |
| `tailwind.config.ts` | Tailwind CSS customization |
| `vercel.json` | Cron job schedules |
| `prisma/schema.prisma` | Database schema definition |

### Core Application

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout, providers, global UI |
| `app/page.tsx` | Home page with feed |
| `app/globals.css` | Global styles, Tailwind imports |
| `lib/prisma.ts` | Database client (singleton) |
| `lib/auth.ts` | NextAuth configuration |

### API Routes

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth handlers | - |
| `/api/prompts` | GET | List prompts (filtered, paginated) | Optional |
| `/api/prompts/[id]` | GET | Get single prompt | Optional |
| `/api/vote` | POST | Cast vote | Required |
| `/api/vote` | DELETE | Remove vote | Required |
| `/api/cron/ingest` | GET | Daily ingestion | CRON_SECRET |
| `/api/cron/refresh-metrics` | GET | Refresh metrics | CRON_SECRET |
| `/api/health` | GET | Health check | - |

### Pages

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/page.tsx` | Home feed with filters |
| `/p/[id]` | `app/p/[id]/page.tsx` | Prompt detail page |
| `/auth/signin` | `app/auth/signin/page.tsx` | Sign-in page |
| `/auth/verify` | `app/auth/verify/page.tsx` | Email verification |

### Components

| Component | Purpose | Client/Server |
|-----------|---------|---------------|
| `Header` | Nav bar with auth | Client |
| `Providers` | NextAuth provider | Client |
| `FilterBar` | Sort/filter controls | Client |
| `PromptFeed` | Fetch and display prompts | Client |
| `PromptCard` | Single prompt card | Client |
| `VoteButtons` | Voting UI | Client |
| `CopyButton` | Copy to clipboard | Client |
| `TweetEmbed` | Render tweet | Client |
| `Pagination` | Page controls | Client |

### Libraries

| Library | Purpose |
|---------|---------|
| `lib/prisma.ts` | Database client |
| `lib/auth.ts` | NextAuth config |
| `lib/x-api.ts` | X API integration |
| `lib/types.ts` | TypeScript types |
| `lib/utils.ts` | Helper functions |

## Data Flow

### Ingestion Flow
```
Vercel Cron (10:00 UTC daily)
  ↓
/api/cron/ingest
  ↓
lib/x-api.ts (search tweets)
  ↓
Extract & parse prompts
  ↓
Save to database (Prisma)
  ↓
Return summary
```

### Feed Display Flow
```
User visits /
  ↓
PromptFeed component
  ↓
Fetch /api/prompts?sort=trending
  ↓
Database query (Prisma)
  ↓
Render PromptCard components
  ↓
Display with embedded tweets
```

### Vote Flow
```
User clicks upvote
  ↓
VoteButtons component
  ↓
POST /api/vote
  ↓
Check auth (NextAuth)
  ↓
Upsert vote in database
  ↓
Return new score
  ↓
Update UI optimistically
```

## Database Schema

### Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `User` | User accounts | id, email, name |
| `Account` | OAuth accounts | userId, provider |
| `Session` | User sessions | userId, token |
| `PromptPost` | AI prompts | tweetId, promptText, viralScore |
| `Vote` | User votes | userId, promptPostId, value |
| `Bookmark` | Saved prompts | userId, promptPostId |

### Indexes

- `PromptPost.tweetId` - Unique, prevent duplicates
- `PromptPost.viralScore` - Sort by trending
- `PromptPost.createdAtX` - Sort by date
- `PromptPost.status` - Filter published
- `PromptPost.model` - Filter by AI model
- `Vote.userId_promptPostId` - Unique constraint
- `Vote.promptPostId` - Fast vote counting

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to DB (dev) |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Open Prisma Studio |

## Environment Variables

See `ENV_TEMPLATE.md` for complete list.

Required for production:
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GITHUB_ID` & `GITHUB_SECRET`
- `X_BEARER_TOKEN`
- `CRON_SECRET`

Optional:
- Email server config (for magic links)

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | NextAuth.js |
| APIs | X API v2, X oEmbed |
| Hosting | Vercel |
| Cron | Vercel Cron Jobs |

## Development Workflow

1. **Local Setup**
   ```bash
   npm install
   npm run db:generate
   npm run db:push
   npm run dev
   ```

2. **Make Changes**
   - Edit files in `app/`, `components/`, or `lib/`
   - Hot reload automatically updates

3. **Database Changes**
   ```bash
   # Edit prisma/schema.prisma
   npm run db:push  # Dev
   # or
   npx prisma migrate dev --name change_name  # Create migration
   ```

4. **Test**
   ```bash
   # Manual API test
   curl http://localhost:3000/api/health
   
   # Test cron
   curl "http://localhost:3000/api/cron/ingest?secret=YOUR_SECRET"
   ```

5. **Deploy**
   ```bash
   git add .
   git commit -m "Description"
   git push
   # Vercel auto-deploys
   ```

## Production Considerations

### Security
- All API routes use TypeScript strict mode
- Input validation with Zod
- CSRF protection via NextAuth
- Rate limiting on vote endpoint
- Cron routes protected with secret

### Performance
- Database indexes on common queries
- Optimistic UI updates for votes
- Connection pooling for database
- Edge caching via Vercel

### Monitoring
- Health check endpoint
- Vercel Analytics
- Function logs in dashboard
- Cron execution history

### Scalability
- Stateless API routes
- Horizontal scaling via Vercel
- Database connection pooling
- Ready for Redis caching

---

This structure follows Next.js 14 best practices with App Router, TypeScript strict mode, and production-ready patterns.
