"use client";

import { ExitIcon } from "./icons";

// replace() (not assign/href) so the app is not left in the back-history.
function quickExit() {
  window.location.replace("https://www.google.com");
}

export default function QuickExit() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 mx-auto flex w-full max-w-[480px] justify-end px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <button
        type="button"
        onClick={quickExit}
        aria-label="Quick exit: leave this site immediately"
        className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/20 bg-night/90 px-3.5 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur transition active:scale-95"
      >
        <ExitIcon width={16} height={16} />
        Quick Exit
      </button>
    </div>
  );
}
