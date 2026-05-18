# Invodex

Invodex is a GST-compliant sales management web app for Indian small and medium businesses. It manages customers, inventory, invoices, payment history, Gmail reminders, contact logs, and AI-powered analytics.

## Stack

- Frontend: React, Vite, TailwindCSS, shadcn-style local components, Recharts
- Backend: FastAPI
- Database/Auth/Storage: Supabase
- AI: Google Gemini
- Email: Gmail SMTP
- Hosting: two Vercel projects from one GitHub repo

## Local Setup

1. Create a Supabase project.
2. In Supabase SQL Editor, run migrations in order:
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_hsn_seed.sql`
   - Optional demo data: edit `003_demo_seed.sql`, replace the zero UUID with a real `auth.users.id`, then run it.
3. Enable Supabase Auth providers:
   - Email/password.
   - Google OAuth, if you want Google sign-in.
4. Copy environment files:
   - Root: copy `.env.example` to `.env`.
   - Client: copy `client/.env.example` to `client/.env`.
5. Install and run backend:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

6. Install and run frontend:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

## Required Backend Environment Variables

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGINS`, for example `http://localhost:5173,https://your-invodex-web.vercel.app`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`, defaults to `gemini-1.5-flash`

## Required Frontend Environment Variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL`, for example `https://your-invodex-api.vercel.app`

## Deploy To Vercel

Deploy the same GitHub repository twice.

### Backend Project

- Project name: `invodex-api`
- Root directory: `/`
- Framework: Other / Python auto-detected
- Runtime entry: `main.py`, exporting `app`
- Add all backend environment variables.
- Deploy and confirm `https://your-api.vercel.app/health`.

### Frontend Project

- Project name: `invodex-web`
- Root directory: `/client`
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Add all frontend environment variables.
- Set `VITE_API_BASE_URL` to the deployed backend URL.

### Supabase Auth Redirect URLs

Add these URLs in Supabase Auth settings:

- `http://localhost:5173`
- `https://your-invodex-web.vercel.app`

## Notes

- PDF download is intentionally scaffolded and returns a dummy success message.
- Manual reminders are implemented. A serverless-safe automated scheduler can be added later through Vercel Cron.
- Gmail SMTP uses a Google app password saved in Settings.
- Never commit `.env` files or real SMTP/API credentials.
