"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = {
  sales: {
    label: "Sales",
    items: [
      { href: "/sales", label: "Listings" },
      { href: "/sales/offers", label: "Offers" },
      { href: "/sales/viewings", label: "Viewings" },
    ],
  },
  lettings: {
    label: "Lettings",
    items: [
      { href: "/lettings", label: "Listings" },
      { href: "/lettings/applications", label: "Applications" },
      { href: "/lettings/viewings", label: "Viewings" },
      { href: "/lettings/maintenance", label: "Maintenance" },
    ],
  },
} as const;

type SectionKey = keyof typeof SECTIONS;

function activeSection(pathname: string): SectionKey {
  return pathname.startsWith("/lettings") ? "lettings" : "sales";
}

export function SidebarNav() {
  const pathname = usePathname();
  const section = activeSection(pathname);

  return (
    <aside className="flex w-56 shrink-0 flex-col bg-navy-950 text-cream">
      <div className="px-5 py-6">
        <span className="font-heading text-xl font-semibold italic text-amber-400">
          PropTune
        </span>
        <p className="mt-0.5 text-[11px] uppercase tracking-wider text-navy-600">Demo CRM</p>
      </div>

      <div className="mx-3 mb-4 flex gap-1 rounded-lg bg-navy-900 p-1">
        {(Object.keys(SECTIONS) as SectionKey[]).map((key) => (
          <Link
            key={key}
            href={`/${key}`}
            className={`flex-1 rounded-md py-1.5 text-center text-sm font-medium transition-colors ${
              section === key ? "bg-amber-500 text-navy-950" : "text-cream/70 hover:text-cream"
            }`}
          >
            {SECTIONS[key].label}
          </Link>
        ))}
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        {SECTIONS[section].items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-navy-800 text-amber-400"
                  : "text-cream/70 hover:bg-navy-900 hover:text-cream"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-5 py-4 text-[11px] text-navy-600">Read-only demo</div>
    </aside>
  );
}
