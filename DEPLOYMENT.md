# Deployment

This repo is a two-service app:

- `frontend/`: Next.js app
- `backend/`: FastAPI app

The cleanest deployment path is:

1. Deploy `backend/` to Render.
2. Deploy `frontend/` to Vercel.

## Backend: Render

Use [render.yaml](/c:/Users/Fagun/Desktop/New%20folder%20(3)/render.yaml) or configure manually:

- Runtime: `Python`
- Build command: `pip install -r backend/requirements.txt`
- Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

Set these environment variables:

- `DATABASE_URL`
- `GOOGLE_API_KEY`
- `JWT_SECRET`
- `APP_ENV=production`
- `FRONTEND_URL=https://your-frontend-domain.vercel.app`
- `BACKEND_URL=https://your-backend-domain.onrender.com`

## Frontend: Vercel

Import the repo and set the root directory to `frontend`.

Build settings:

- Install command: `npm install`
- Build command: `npm run build`
- Output: Next.js default

Set these environment variables:

- `BACKEND_URL=https://your-backend-domain.onrender.com`
- `NEXT_PUBLIC_WS_URL=wss://your-backend-domain.onrender.com`

`BACKEND_URL` is used by Next.js rewrites for HTTP requests. `NEXT_PUBLIC_WS_URL` is required for the live editor WebSocket in production.

## Local env templates

- Backend template: [backend/.env.example](/c:/Users/Fagun/Desktop/New%20folder%20(3)/backend/.env.example)
- Frontend template: [frontend/.env.example](/c:/Users/Fagun/Desktop/New%20folder%20(3)/frontend/.env.example)
- Shared reference: [.env.example](/c:/Users/Fagun/Desktop/New%20folder%20(3)/.env.example)

## Important

- Rotate any real secrets currently stored in local `.env` files before pushing this repo.
- Add the deployed frontend URL to the backend `FRONTEND_URL`, or browser auth/API calls will fail on CORS.
- If you change your backend domain later, update both frontend env vars and redeploy Vercel.
