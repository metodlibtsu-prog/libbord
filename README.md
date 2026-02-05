# Libbord — Analytics Dashboard for Libraries

Analytics dashboard for scientific libraries with Yandex.Metrika integration, manual metrics input, and insights engine.

## Tech Stack

- **Backend:** FastAPI (Python 3.11+), SQLAlchemy 2.0 async, PostgreSQL
- **Frontend:** React 18 + TypeScript, Vite, Recharts, TanStack Query, Tailwind CSS
- **Database:** PostgreSQL via Supabase
- **Auth:** Supabase Auth (email/password)
- **Hosting:** Railway (backend), Vercel (frontend)

## Features

- **Public Dashboard** (4 blocks):
  - KPI cards: views, visits, users, period-over-period deltas
  - Channel breakdown: website, e-library, catalog, Telegram, VK, mobile app
  - User behavior: avg time, page depth, bounce rate, return rate
  - Engagement: likes, reposts, comments, reviews
- **Admin Panel**:
  - Manage channels and Yandex.Metrika counters
  - Manual metric entry for social channels
  - Review/feedback logging
- **Insights Engine**: Auto-generated analytical hints based on 7 rules

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 20+
- Supabase account (for database & auth)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/libbord.git
   cd libbord
   ```

2. **Database setup**
   - Create a Supabase project
   - Run `backend/app/migrations/001_initial.sql` in Supabase SQL Editor
   - Run `backend/app/migrations/002_seed_data.sql` for seed data

3. **Backend setup**
   ```bash
   cd backend
   pip install -e .
   cp .env.example .env
   # Edit .env with your Supabase credentials
   uvicorn app.main:app --reload
   ```

4. **Frontend setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your Supabase URL and anon key
   npm run dev
   ```

5. **Open http://localhost:5173**

## Deployment

### Backend (Railway)

1. Connect Railway to your GitHub repo
2. Set environment variables from `backend/.env.example`
3. Railway auto-deploys on push to `main`

### Frontend (Vercel)

1. Import project from GitHub to Vercel
2. Set root directory: `frontend`
3. Framework preset: Vite
4. Set environment variables from `frontend/.env.example`
5. Vercel auto-deploys on push to `main`

## Environment Variables

### Backend

```
DATABASE_URL=postgresql+asyncpg://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_JWT_SECRET=...
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGINS=["https://your-frontend.vercel.app"]
```

### Frontend

```
VITE_API_BASE_URL=https://your-backend.up.railway.app/api
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

## Project Structure

```
libbord/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routers/         # API endpoints
│   │   ├── services/        # Business logic
│   │   └── migrations/      # SQL migrations
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── api/             # API client
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # TanStack Query hooks
│   │   └── context/         # React contexts
│   └── package.json
└── README.md
```

## License

MIT
