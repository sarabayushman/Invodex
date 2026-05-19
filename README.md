## Invodex

A sample full-stack web app with a React frontend and FastAPI backend. It is structured for deployment to Vercel from GitHub.

### Project structure

- `frontend/` - Vite + React single page app with two routes: `/` and `/dashboard`
- `api/` - FastAPI serverless backend exposed through `/api/*`
- `vercel.json` - Vercel build and routing configuration

### Run locally

Install and run the frontend:

```bash
cd frontend
npm install
npm run dev
```

Install and run the backend:

```bash
cd api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

For local frontend-to-backend calls, create `frontend/.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

You can skip the env file when using Vite locally because `frontend/vite.config.js` proxies `/api/*` to `http://localhost:8000`.

### Deploy to Vercel

1. Push this repository to GitHub.
2. Import the repository in Vercel.
3. Keep the default project root as the repository root.
4. Deploy. Vercel will build `frontend/` and route `/api/*` to FastAPI.
