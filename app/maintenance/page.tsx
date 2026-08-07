import Link from "next/link";
import { getAllProperties, getMaintenanceIssues } from "@/lib/ui/api-client";
import { resolveContacts } from "@/lib/ui/resolve-contacts";
import { formatDate, titleCase } from "@/lib/ui/format";
import { Pill } from "@/components/pill";
import { urgencyTone } from "@/lib/ui/status-tone";

const COLUMNS = [
  { status: "reported", label: "Reported" },
  { status: "in_progress", label: "In Progress" },
  { status: "resolved", label: "Resolved" },
] as const;

export default async function MaintenanceBoardPage() {
  const [{ maintenance_issues: issues }, properties] = await Promise.all([
    getMaintenanceIssues(),
    getAllProperties(),
  ]);

  const propertyByRef = new Map(properties.map((p) => [p.ref, p]));
  const contacts = await resolveContacts(issues.map((i) => i.contact_id));

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-navy-950">Maintenance Board</h1>
        <p className="text-sm text-ink-muted">{issues.length} issues on file</p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {COLUMNS.map((column) => {
          const columnIssues = issues.filter((i) => i.status === column.status);
          return (
            <div key={column.status} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-base font-semibold text-navy-950">
                  {column.label}
                </h2>
                <span className="text-xs text-ink-faint">{columnIssues.length}</span>
              </div>

              {columnIssues.length === 0 ? (
                <p className="text-xs text-ink-faint">—</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {columnIssues.map((issue) => {
                    const property = issue.property_ref ? propertyByRef.get(issue.property_ref) : null;
                    return (
                      <li
                        key={issue.id}
                        className="rounded-lg border border-border-hairline bg-paper p-3 text-sm"
                      >
                        <div className="mb-1 flex items-start justify-between gap-2">
                          {issue.property_ref ? (
                            <Link
                              href={`/properties/${issue.property_ref}`}
                              className="font-medium text-navy-950 hover:underline"
                            >
                              {property?.address_line1 ?? issue.property_ref}
                            </Link>
                          ) : (
                            <span className="font-medium text-navy-950">Unknown property</span>
                          )}
                          {issue.urgency && (
                            <Pill tone={urgencyTone(issue.urgency)} label={titleCase(issue.urgency)} />
                          )}
                        </div>
                        <p className="text-ink">{issue.description}</p>
                        <p className="mt-2 text-xs text-ink-muted">
                          {issue.contact_id && contacts.get(issue.contact_id)
                            ? `${contacts.get(issue.contact_id)!.name} · `
                            : ""}
                          {formatDate(issue.created_at)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
