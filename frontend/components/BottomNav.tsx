"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { DigitalIcon, EvidenceIcon, HomeIcon, JourneyIcon, RouteIcon } from "./icons";

const TABS: {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/journey", label: "Journey", Icon: JourneyIcon },
  { href: "/safe-routes", label: "Safe Routes", Icon: RouteIcon },
  { href: "/evidence", label: "Evidence", Icon: EvidenceIcon },
  { href: "/digital", label: "Digital", Icon: DigitalIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[480px] border-t border-edge bg-night/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="grid grid-cols-5">
        {TABS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active ? "text-rose" : "text-white/55 hover:text-white/80"
                }`}
              >
                <Icon />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
