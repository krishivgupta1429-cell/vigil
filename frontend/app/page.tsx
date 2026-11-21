import ContactsPanel from "@/components/ContactsPanel";
import SosButton from "@/components/SosButton";
import ZoneCard, { type Zone } from "@/components/ZoneCard";

const ZONES: Zone[] = [
  {
    name: "Streets",
    description: "Walk with a safer route and a trusted contact one tap away.",
    accent: "bg-rose",
  },
  {
    name: "Rides",
    description: "Share live cab and auto trips so someone always knows where you are.",
    accent: "bg-teal",
  },
  {
    name: "Home",
    description: "Quiet ways to ask for help and keep your details private.",
    accent: "bg-gold",
  },
  {
    name: "Workplace/Campus",
    description: "Record incidents and report unsafe spots around you.",
    accent: "bg-violet",
  },
  {
    name: "Online",
    description: "Check threatening messages and get help with image abuse.",
    accent: "bg-rose",
  },
];

export default function Home() {
  return (
    <div className="space-y-10">
      <header className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rose">Vigil</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Prevent. Protect. Prove.</h1>
      </header>

      <SosButton />

      <section aria-labelledby="zones-heading">
        <h2 id="zones-heading" className="text-lg font-semibold">
          Five zones of safety
        </h2>
        <div className="mt-3 grid gap-3">
          {ZONES.map((z) => (
            <ZoneCard key={z.name} zone={z} />
          ))}
        </div>
      </section>

      <ContactsPanel />
    </div>
  );
}
