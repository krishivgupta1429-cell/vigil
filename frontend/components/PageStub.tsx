export default function PageStub({
  title,
  blurb,
  milestone,
}: {
  title: string;
  blurb: string;
  milestone: string;
}) {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-white/60">{blurb}</p>
      <div className="mt-6 rounded-2xl border border-edge bg-card p-6 text-center">
        <p className="text-lg font-semibold text-gold">Coming soon</p>
        <p className="mt-1 text-sm text-white/55">Planned for {milestone}.</p>
      </div>
    </>
  );
}
