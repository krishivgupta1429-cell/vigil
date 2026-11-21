"use client";

import { useRef, useState } from "react";
import { searchPlaces, type Place } from "./nominatim";

// One request per submitted search (no search-as-you-type: Nominatim forbids it).
export default function PlaceSearch({ onSelect }: { onSelect: (p: Place) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ctrl = useRef<AbortController | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 3) {
      setError("Type at least 3 characters.");
      return;
    }
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setLoading(true);
    setError(null);
    try {
      const places = await searchPlaces(query, c.signal);
      if (c.signal.aborted) return;
      setResults(places);
    } catch (err) {
      if (!c.signal.aborted) {
        setResults(null);
        setError(err instanceof Error ? err.message : "Search failed.");
      }
    } finally {
      if (ctrl.current === c) setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a place (optional)"
          aria-label="Search for a place"
          className="min-w-0 flex-1 rounded-xl border border-edge bg-card px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-teal focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-teal px-4 text-sm font-semibold text-night transition active:scale-95 disabled:opacity-50"
        >
          {loading ? "…" : "Search"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-2 rounded-xl bg-rose/15 px-3.5 py-2 text-sm text-rose">
          {error}
        </p>
      )}
      {results && results.length === 0 && !error && (
        <p className="mt-2 text-sm text-white/50">No places found. Try another name, or tap the map.</p>
      )}
      {results && results.length > 0 && (
        <ul className="mt-2 divide-y divide-edge overflow-hidden rounded-xl border border-edge bg-card">
          {results.map((p, i) => (
            <li key={`${p.lat},${p.lng},${i}`}>
              <button
                type="button"
                onClick={() => {
                  onSelect(p);
                  setResults(null);
                }}
                className="block w-full px-3.5 py-2.5 text-left transition hover:bg-white/5"
              >
                <span className="block text-sm font-medium">{p.name}</span>
                <span className="block truncate text-xs text-white/50">{p.fullName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
