import type { Metadata } from "next";
import { Suspense } from "react";
import TrackView from "@/components/journey/TrackView";

export const metadata: Metadata = {
  title: "Live journey · Vigil",
  robots: { index: false, follow: false },
};

// The shared layout's bottom nav reads the pathname, which is unknown while
// prerendering a dynamic route, so this page is allowed to render per request.
// (Proper fix: see docs/shared-changes.md.)
export const instant = false;

async function Token({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <TrackView token={token} />;
}

export default function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Suspense fallback={<h1 className="text-2xl font-bold tracking-tight">Live journey</h1>}>
      <Token params={params} />
    </Suspense>
  );
}
