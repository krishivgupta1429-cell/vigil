# Vigil

**Prevent. Protect. Prove.**

Vigil is a mobile-first web app (PWA) that helps protect women before, during and after danger across five zones of risk: **streets, rides, home, workplace/campus and online**. It is built from scratch at SatHack 2026 by team Coffee n Code.

> Status: milestone M0 (foundation). The app shell, theme, navigation, PWA manifest, database models and a working trusted-contacts API are in place. SOS, journey tracking, safe routes, evidence vault and digital safety are stubs that land in later milestones.

Notes on honesty: Telegram stands in for SMS in the demo. AI output is guidance, not legal or medical advice.

## Repository layout

```
backend/    FastAPI + SQLModel + SQLite API
frontend/   Next.js (App Router, TypeScript, Tailwind) PWA
docs/       Project docs
```

The browser only calls `/api/*`. Next.js rewrites those requests to the backend (`next.config.ts`), so phones never talk to the backend port directly and a single HTTPS tunnel is enough.

## Running it

You need two terminals.

### Backend terminal

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

First time only: `python3.12 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`.

Optional secrets go in `backend/.env` (see `backend/.env.example`). Nothing crashes if a key is missing. `backend/vigil.db` is created automatically on startup.

Check it: <http://localhost:8000/api/health> returns `{"status":"ok"}`, and <http://localhost:8000/docs> shows the API.

### Frontend terminal

```bash
cd frontend
npm install        # first time only
npm run dev
```

Open <http://localhost:3000>.

### Using a different backend port

Ports can differ per machine (for example, something else may already use 8000). Start the backend on any port, then tell the frontend where it is in `frontend/.env.local`:

```bash
# frontend/.env.local   (not committed)
BACKEND_URL=http://localhost:8001
```

Restart `npm run dev` after changing it. If `BACKEND_URL` is unset the frontend uses `http://localhost:8000`.

### Testing on a phone

Geolocation, camera and microphone only work over HTTPS on phones. Expose the frontend (port 3000) through an HTTPS tunnel such as Cloudflare Tunnel or ngrok and open the tunnel URL on your phone. Only the frontend needs a tunnel.

## Libraries used

Every open-source library used in this project, and what it is for.

### Frontend

| Library | Purpose |
| --- | --- |
| [Next.js](https://nextjs.org) | React framework: App Router, routing, the `/api` rewrite to the backend |
| [React](https://react.dev) / react-dom | UI library |
| [Tailwind CSS](https://tailwindcss.com) + `@tailwindcss/turbopack` | Utility-first styling and its Turbopack loader |
| [TypeScript](https://www.typescriptlang.org) | Type-checked JavaScript |
| [Leaflet](https://leafletjs.com) | Interactive maps (used from M1) |
| [react-leaflet](https://react-leaflet.js.org) | React bindings for Leaflet |
| `@types/leaflet`, `@types/node`, `@types/react`, `@types/react-dom` | TypeScript type definitions |
| [ESLint](https://eslint.org) + `eslint-config-next` | Linting |
| `babel-plugin-react-compiler` | React Compiler (automatic memoization) |
| [Geist](https://vercel.com/font) (via `next/font`) | Typeface (SIL Open Font License) |

### Backend

| Library | Purpose |
| --- | --- |
| [FastAPI](https://fastapi.tiangolo.com) | Web API framework |
| [Uvicorn](https://www.uvicorn.org) | ASGI server |
| [SQLModel](https://sqlmodel.tiangolo.com) | ORM / models (built on SQLAlchemy and Pydantic) |
| [SQLAlchemy](https://www.sqlalchemy.org) | Database toolkit used by SQLModel |
| [Pydantic](https://docs.pydantic.dev) | Request validation |
| [python-multipart](https://github.com/Kludex/python-multipart) | Multipart uploads for evidence chunks (M6) |
| [ReportLab](https://www.reportlab.com/opensource/) | PDF incident report (M6) |
| [Pillow](https://python-pillow.org) | Image handling (M7) |
| [ImageHash](https://github.com/JohannesBuchner/imagehash) | Perceptual image hashing (M7) |
| [python-dotenv](https://github.com/theskumar/python-dotenv) | Load `backend/.env` |
| [HTTPX](https://www.python-httpx.org) | HTTP client (Telegram, external calls) |
| [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-python) | Installed in the environment; not used in M0 |

### Data and services (planned)

| Resource | Purpose |
| --- | --- |
| [OpenStreetMap](https://www.openstreetmap.org) data and tiles | Base map (ODbL) |
| [OSRM](https://project-osrm.org) | Route alternatives (M4) |
| [Overpass API](https://overpass-api.de) | Street lamps, shops and police posts, prefetched into `backend/data/` (M4) |
| Google Gemini API | LLM for message analysis and report drafting, through `backend/app/llm.py` (not called yet) |
| Telegram Bot API | Alert delivery, standing in for SMS in the demo (M2) |
