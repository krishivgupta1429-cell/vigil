"use client";

// Placeholder for M2: pressing does nothing yet except animate.
export default function SosButton() {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-52 w-52 items-center justify-center">
        <span
          aria-hidden
          className="sos-ring absolute inset-0 rounded-full bg-rose/40"
        />
        <button
          type="button"
          aria-label="SOS (not active yet)"
          className="relative flex h-44 w-44 select-none items-center justify-center rounded-full bg-gradient-to-b from-[#ff6b95] to-rose text-4xl font-extrabold tracking-wider text-white shadow-[0_10px_40px_-8px_rgba(255,77,126,0.8)] ring-4 ring-rose/30 transition duration-150 active:scale-90 active:shadow-[0_4px_16px_-4px_rgba(255,77,126,0.8)]"
        >
          SOS
        </button>
      </div>
      <p className="mt-2 text-xs text-white/45">Placeholder: alerts are not active yet.</p>
    </div>
  );
}
