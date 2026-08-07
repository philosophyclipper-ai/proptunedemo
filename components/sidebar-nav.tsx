"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Listings" },
  { href: "/diary", label: "Diary" },
  { href: "/offers", label: "Offers" },
  { href: "/maintenance", label: "Maintenance" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col bg-navy-950 text-cream">
      <div className="px-5 py-6">
        <span className="font-heading text-xl font-semibold italic text-amber-400">
          PropTune
        </span>
        <p className="mt-0.5 text-[11px] uppercase tracking-wider text-navy-600">
          Demo CRM
        </p>
      </div>
      <nav className="flex flex-col gap-0.5 px-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
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
      <div className="mt-auto px-5 py-4 text-[11px] text-navy-600">
        Read-only demo
      </div>
    </aside>
  );
}
