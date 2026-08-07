import Link from "next/link";

export function ListingsFilterForm({
  basePath,
  statusOptions,
  status,
  postcode,
}: {
  basePath: string;
  statusOptions: { value: string; label: string }[];
  status?: string;
  postcode?: string;
}) {
  return (
    <form
      method="GET"
      action={basePath}
      className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-border-hairline bg-paper p-4"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-ink-muted" htmlFor="status">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={status ?? ""}
          className="rounded border border-border-hairline bg-cream px-2 py-1.5 text-sm text-ink"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-ink-muted" htmlFor="postcode">
          Postcode
        </label>
        <input
          id="postcode"
          name="postcode"
          defaultValue={postcode ?? ""}
          placeholder="e.g. EH2"
          className="rounded border border-border-hairline bg-cream px-2 py-1.5 text-sm text-ink placeholder:text-ink-faint"
        />
      </div>
      <button
        type="submit"
        className="rounded bg-navy-900 px-4 py-1.5 text-sm font-medium text-cream hover:bg-navy-800"
      >
        Filter
      </button>
      {(status || postcode) && (
        <Link href={basePath} className="text-sm text-ink-muted underline underline-offset-2">
          Clear
        </Link>
      )}
    </form>
  );
}
