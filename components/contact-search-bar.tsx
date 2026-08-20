"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchContacts, type ContactSearchResult } from "@/lib/ui/search";

// Top-level contact search — lives next to Add Contact wherever that button
// appears. Searches every contact regardless of section (a vendor lookup
// from the Lettings side is still useful), debounced, with each result
// showing the contact's most relevant property relationship.
export function ContactSearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ContactSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    const timeout = setTimeout(() => {
      if (trimmed.length < 2) {
        setResults([]);
        setOpen(false);
        return;
      }
      startTransition(async () => {
        const found = await searchContacts(query);
        setResults(found);
        setOpen(true);
      });
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  function goToContact(id: string) {
    setOpen(false);
    setQuery("");
    router.push(`/contacts/${id}`);
  }

  return (
    <div ref={containerRef} className="relative w-72">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search contacts by name or number…"
        className="w-full rounded border border-border-hairline bg-paper px-3 py-1.5 text-sm text-ink placeholder:text-ink-faint"
      />
      {open && (
        <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-lg border border-border-hairline bg-paper shadow-lg">
          {pending ? (
            <p className="px-3 py-2 text-sm text-ink-muted">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-ink-muted">No matches.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {results.map((r) => (
                <li key={r.contact.id}>
                  <button
                    type="button"
                    onClick={() => goToContact(r.contact.id)}
                    className="block w-full cursor-pointer px-3 py-2 text-left hover:bg-cream-dim"
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-medium text-navy-950">{r.contact.name}</span>
                      <span className="shrink-0 text-xs text-ink-faint">
                        {r.contact.phone_primary}
                      </span>
                    </span>
                    {r.relationshipLabel && (
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {r.relationshipLabel}
                        {r.propertyAddress ? `: ${r.propertyAddress}` : ""}
                      </p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
