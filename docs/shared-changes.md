# Shared changes requested by modules

Module owners add notes here instead of editing shared files (main.py, config.py, db.py, layout, bottom nav, theme, globals.css, lib/api.ts, models.py).

## M1 Journey (feat/journey)

NEEDS SHARED CHANGE: `frontend/app/layout.tsx` + `frontend/components/BottomNav.tsx`
- The public page `/track/[token]` must not show the bottom nav. Right now `TrackView` hides it with a scoped `<style>` (`nav[aria-label="Main"]{display:none}`), which is a workaround.
- Because `BottomNav` calls `usePathname()` in the root layout, the dynamic route `/track/[token]` cannot be prerendered (Next 16 `cacheComponents`), so `app/track/[token]/page.tsx` sets `export const instant = false`.
- Proper fix: move the bottom nav into a route group layout (e.g. `app/(app)/layout.tsx`) that `/track` is not part of, or wrap `<BottomNav />` in `<Suspense>` and hide it for `/track/*`. Then remove the `<style>` hack in `components/journey/TrackView.tsx` and the `instant = false` line.

NEEDS SHARED CHANGE: `frontend/app/layout.tsx`
- Journey tracking keeps running across tab changes (the engine is a module-level store), but after a full page reload it only resumes once Home or Journey is opened. Mounting `<ActiveJourneyCard />` (or a tiny `<JourneyBoot />` that calls `ensureLoaded()` from `components/journey/journeyStore.ts`) in the root layout would resume it on any page.

NEEDS SHARED CHANGE (optional): `frontend/app/page.tsx`
- Home was edited minimally (one import and `<ActiveJourneyCard />`) because the "Journey in progress" card was requested for Home. Revert if the Home owner prefers to place it themselves; the component is `components/journey/ActiveJourneyCard.tsx`.

Notes
- `share_token` and `destination_name` live in a new table `JourneyShare` in `backend/app/models_journey.py` (not on `Journey`), so `models.py` and the existing `vigil.db` are untouched: the new table is created automatically on startup. No need to delete `vigil.db`.
- `/api/track/{token}` is served from `routers/journeys.py` (the router has no prefix and declares both `/journeys/...` and `/track/...`), so `main.py` needed no change.
- Pings accept `age_ms` (how long ago the fix was taken) instead of an absolute `ts`, so a wrong phone clock can't skew the timeline. CLAUDE.md's contract shows `ts`; update it if you want the two to match.

### Libraries
- No new npm or pip packages. Leaflet, react-leaflet and `@types/leaflet` were already installed and listed in the README.
- Services used from the browser: OpenStreetMap tile server (`tile.openstreetmap.org`, ODbL, attribution shown on the map) and OpenStreetMap Nominatim (`nominatim.openstreetmap.org`) for place search. README's data/services table could list Nominatim.
