import Link from "next/link";
import { getAllContacts } from "@/lib/ui/api-client";
import { titleCase } from "@/lib/ui/format";
import { Pill } from "@/components/pill";
import { AddContactButton } from "@/components/add-contact-button";
import { ContactSearchBar } from "@/components/contact-search-bar";

const SECTION_ROLES: Record<"sales" | "lettings", string[]> = {
  sales: ["vendor", "buyer", "solicitor"],
  lettings: ["landlord", "tenant", "applicant", "contractor"],
};

export async function ContactsList({ section }: { section: "sales" | "lettings" }) {
  const allContacts = await getAllContacts();
  const relevantRoles = SECTION_ROLES[section];
  const contacts = allContacts
    .filter((c) => c.roles.some((r) => relevantRoles.includes(r)))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="p-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy-950">Contacts</h1>
          <p className="text-sm text-ink-muted">{contacts.length} contacts</p>
        </div>
        <div className="flex items-center gap-2">
          <ContactSearchBar />
          <AddContactButton section={section} />
        </div>
      </header>

      {contacts.length === 0 ? (
        <p className="text-sm text-ink-muted">No contacts yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border-hairline bg-paper">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-hairline text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Roles</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Company</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="border-b border-border-hairline last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/contacts/${contact.id}`}
                      className="font-medium text-navy-950 hover:underline"
                    >
                      {contact.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {contact.roles.map((role) => (
                        <Pill key={role} tone="navy" label={titleCase(role)} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{contact.phone_primary}</td>
                  <td className="px-4 py-3 text-ink-muted">{contact.email ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{contact.company ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
