# Vigil: women's safety PWA (SatHack 2026, team Coffee n Code)

## What we are building
Vigil is a mobile-first web app (PWA) that protects women before, during and after danger across five zones of risk: streets, rides, home, workplace or campus, and online.
Pitch line: Prevent. Protect. Prove.

## Hackathon rules (must follow)
- Everything is written from scratch during SatHack. Do not paste in code from older projects.
- Public GitHub repo. List every open-source library in README.md under "Libraries used".
- A working live demo matters more than breadth. Feature freeze at 03:00.

## Stack
- frontend/: Next.js (App Router, TypeScript), Tailwind, Leaflet + OpenStreetMap
- backend/: FastAPI, SQLModel + SQLite, reportlab (PDF), Pillow + imagehash, anthropic SDK
- The browser calls the backend only through /api/* (a Next.js rewrite to http://localhost:8000). Phones never talk to port 8000 directly, so a single HTTPS tunnel is enough.
- Secrets live in backend/.env (never commit it). Required: ANTHROPIC_API_KEY, TELEGRAM_BOT_TOKEN.
- Geolocation, camera, microphone and motion sensors only work over HTTPS on phones, so test through the tunnel from the start.

## Conventions
- When you give terminal commands, say which terminal they belong to: frontend, backend, or project root.
- Prefer terminal commands over manual edits when changing setup or config.
- Small commits, one feature per branch (feat/<module>), run `git pull --rebase origin main` before pushing.
- Mobile first (390px wide). Dark theme: background #0B1026, rose #FF4D7E, teal #2DD4BF, gold #F5B83D, white text.
- Every screen has a visible quick-exit button.
- Demo data lives in backend/seed.py so the demo is repeatable.

## API contract (keep in sync; the frontend can mock these while the backend is built)
- GET  /api/health
- POST /api/journeys                 start a journey (route polyline, vehicle plate, driver, contacts) -> {id, share_token}
- POST /api/journeys/{id}/ping       {lat, lng, ts, speed}
- POST /api/journeys/{id}/checkin
- GET  /api/track/{share_token}      public live view for trusted contacts
- POST /api/alerts                   trigger SOS or escalation -> notifies contacts via Telegram
- POST /api/evidence                 multipart chunk with incident_id; server stores the file and extends the hash chain
- GET  /api/incidents/{id}/report.pdf
- GET  /api/routes?from=&to=         up to 3 alternatives with risk score and explanation
- GET/POST /api/reports              community reports; POST /api/reports/{id}/confirm
- POST /api/analyze/message          message analyzer
- POST /api/shield/takedown-draft    takedown request draft
- GET  /api/resources                helplines and support directory

## Modules (build in this order)
M0 Foundation: scaffolds, rewrite rule, SQLite models, shared layout and theme, PWA manifest, README with libraries section.
   Done when: a phone opens the HTTPS tunnel URL, sees the home screen, and /api/health responds.
M1 Journey Mode and live tracking: start journey form (vehicle plate, driver, pickup, destination, trusted contacts), location ping every 5 s, Wake Lock to keep the screen on, check-in timer, public page /track/[token].
   Done when: a contact opens the tracking link and sees a moving marker.
M2 SOS and escalation: large SOS button, countdown with secret-PIN cancel, POST /api/alerts, Telegram message with the tracking link, escalation steps (contacts, second nudge, then a prompt to call 112).
   Done when: pressing SOS reaches Telegram within 5 seconds.
M3 Anomaly triggers (inside a journey): route deviation (more than 150 m off the planned route for 60 s), unexpected long stop (3 min), sudden motion spike (DeviceMotion). Each shows "Are you okay?" with a 20 s countdown, then escalates. Include a simulate panel to fire each trigger for the demo.
M4 Safe routes: OSRM alternatives scored on street lamps, open shops, police posts and recent reports using Overpass data prefetched for the Patiala/Thapar area (store it in backend/data/, do not call Overpass live). Show safest vs shortest with an explanation of the score.
M5 Community map: report poor lighting, harassment-prone spots, unsafe stops; confirm button for verification status; seeded data; markers on the map.
M6 Evidence vault and report: record audio or video with MediaRecorder in 5 s chunks, upload chunks, SHA-256 hash chain (hash = sha256(prev_hash + file_hash + timestamp)), incident timeline, PDF report with an AI-drafted complaint and the hash table. Label it "guidance, not legal advice".
M7 Digital safety: message analyzer (LLM returns JSON: threat_level, category, advice, evidence steps), image shield (perceptual hash computed in the browser, match demo, takedown draft), sextortion first-aid steps with cybercrime.gov.in.
M8 Disguise and support: calculator disguise (secret code opens the app, another code triggers SOS), private diary encrypted with WebCrypto AES-GCM using a PIN-derived key, support directory (112, 181, cybercrime.gov.in), quick exit.
M9 Polish: landing page showing the five zones, demo mode, empty and error states, README, deployment.

## Demo script (3 minutes)
1. Pick a destination: safe route vs shortest route.
2. Start Journey Mode with cab details; a contact opens the live tracking link.
3. Simulate a route deviation: "Are you okay?" appears, then escalates.
4. Silent SOS from the calculator disguise; Telegram alert arrives.
5. Evidence is saved and one tap produces the report PDF.
6. Show the message analyzer on a sample sextortion message.

## Honesty rules (do not break these in code or in the pitch)
- Do not claim Bluetooth tracker detection or offline mesh. They are roadmap items.
- Telegram stands in for SMS in the demo. Say so.
- LLM outputs are labelled as guidance, not legal or medical advice.
- Only claim "on-device" for things that really run in the browser.
- The simulate panel is for demos and must be clearly separate from real triggers.

## LLM provider (free tier)
- Use Google Gemini via the google-genai SDK, NOT the Anthropic SDK. Key in GEMINI_API_KEY, model in LLM_MODEL (backend/.env).
- All LLM calls go through backend/app/llm.py with one function: generate(prompt, system=None) -> str.
- If the key is missing, the call fails, or the rate limit is hit, return a fixed template response instead of raising. Demo must never crash.
- Cache LLM responses by input hash so repeated demo runs don't use quota.
- Only send demo/fake data to the LLM, never real personal data.

## Team workflow rules (5 people, each owns one module)
- Work ONLY on your assigned milestone, on your own branch (feat/<module>). Never commit to master directly.
- Only create or edit files for your own module: backend/app/routers/<module>.py, backend/app/services/<module>_*.py, frontend/app/<module>/, frontend/components/<module>/.
- Do NOT edit shared files: main.py, config.py, db.py, layout, bottom nav, theme, globals.css, lib/api.ts. If you need a change there, add a short note "NEEDS SHARED CHANGE: ..." to docs/shared-changes.md instead.
- New database tables go in a NEW file backend/app/models_<module>.py (imported from your router). Do not edit models.py.
- Do not regenerate requirements.txt. List new libraries in docs/shared-changes.md under "Libraries".
- Provide demo data or a seed/simulate option so the module can be shown without real-world conditions.
- Secrets live only in backend/.env (git-ignored). Never commit keys.
- When done, stop and list exactly how to test the module.
