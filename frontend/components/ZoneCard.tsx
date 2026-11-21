export type Zone = {
  name: string;
  description: string;
  /** Tailwind classes must be literal strings so they are not purged. */
  accent: string;
};

export default function ZoneCard({ zone }: { zone: Zone }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-edge bg-card p-4">
      <span
        aria-hidden
        className={`mt-0.5 h-10 w-1.5 shrink-0 rounded-full ${zone.accent}`}
      />
      <div>
        <h3 className="font-semibold">{zone.name}</h3>
        <p className="mt-0.5 text-sm leading-snug text-white/60">{zone.description}</p>
      </div>
    </div>
  );
}
