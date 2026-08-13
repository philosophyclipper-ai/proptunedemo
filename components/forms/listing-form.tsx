"use client";

import { useMutationForm } from "@/lib/ui/use-mutation-form";
import { createListing, updateListing } from "@/lib/ui/actions";
import { Field, inputClass } from "@/components/forms/field";
import type { Property, User } from "@/lib/ui/types";

const PRICE_QUALIFIERS = [
  { value: "offers_over", label: "Offers Over" },
  { value: "fixed_price", label: "Fixed Price" },
  { value: "offers_around", label: "Offers Around" },
  { value: "offers_in_region_of", label: "Offers in the Region Of" },
  { value: "poa", label: "POA" },
];
function viewingConductedByOptions(isLettings: boolean) {
  return [
    { value: "agency_staff", label: "Agency Staff" },
    { value: "viewing_agent", label: "Viewing Agent" },
    { value: "vendor", label: isLettings ? "Landlord" : "Vendor" },
  ];
}
const SALES_STATUSES = [
  ["available", "Available"],
  ["under_offer", "Under Offer"],
  ["sold", "Sold"],
  ["withdrawn", "Withdrawn"],
] as const;
const LETTINGS_STATUSES = [
  ["on_market", "On the Market"],
  ["let", "Let"],
] as const;

type Props =
  | { mode: "create"; listingType: "sales" | "lettings"; users: User[]; onSuccess: () => void }
  | {
      mode: "edit";
      listingType: "sales" | "lettings";
      property: Property;
      vendorName?: string;
      vendorPhone?: string;
      vendorEmail?: string;
      viewingNotes?: string | null;
      users: User[];
      onSuccess: () => void;
    };

function toDateInputValue(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : "";
}

export function ListingForm(props: Props) {
  const isLettings = props.listingType === "lettings";
  const property = props.mode === "edit" ? props.property : undefined;

  const action =
    props.mode === "create"
      ? createListing
      : updateListing.bind(null, property!.ref, props.listingType);

  const { state, formAction, pending } = useMutationForm(action, props.onSuccess);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Address Line 1">
          <input
            name="address_line1"
            required
            defaultValue={property?.address_line1}
            className={inputClass}
          />
        </Field>
        <Field label="Address Line 2">
          <input name="address_line2" defaultValue={property?.address_line2 ?? ""} className={inputClass} />
        </Field>
        <Field label="City">
          <input name="city" defaultValue={property?.city ?? ""} className={inputClass} />
        </Field>
        <Field label="Postcode">
          <input name="postcode" required defaultValue={property?.postcode} className={inputClass} />
        </Field>
        <Field label="Bedrooms">
          <input
            name="bedrooms"
            type="number"
            min={0}
            defaultValue={property?.bedrooms ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Property Type">
          <input
            name="property_type"
            placeholder="flat, house, ..."
            defaultValue={property?.property_type ?? "flat"}
            className={inputClass}
          />
        </Field>
        <Field label="Council Tax Band">
          <input
            name="council_tax_band"
            defaultValue={property?.council_tax_band ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="EPC Rating">
          <input name="epc_rating" defaultValue={property?.epc_rating ?? ""} className={inputClass} />
        </Field>
        <Field label="Negotiator">
          <select
            name="negotiator_id"
            defaultValue={property?.negotiator_id ?? props.users[0]?.id ?? ""}
            className={inputClass}
          >
            <option value="">Unassigned</option>
            {props.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Went Live">
          <input
            name="went_live_at"
            type="date"
            defaultValue={
              props.mode === "edit"
                ? toDateInputValue(property?.went_live_at)
                : new Date().toISOString().slice(0, 10)
            }
            className={inputClass}
          />
        </Field>
      </div>

      {isLettings ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Rent Amount (£)">
            <input
              name="rent_amount"
              type="number"
              min={0}
              step="1"
              defaultValue={property?.rent_amount ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Rent Frequency">
            <select
              name="rent_frequency"
              defaultValue={property?.rent_frequency ?? "monthly"}
              className={inputClass}
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </Field>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price Qualifier">
            <select
              name="price_qualifier"
              defaultValue={property?.price_qualifier ?? "offers_over"}
              className={inputClass}
            >
              {PRICE_QUALIFIERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Asking Price (£)">
            <input
              name="asking_price"
              type="number"
              min={0}
              step="1"
              defaultValue={property?.asking_price ?? ""}
              className={inputClass}
            />
          </Field>
        </div>
      )}

      {props.mode === "edit" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <select name="status" defaultValue={property?.status} className={inputClass}>
              {(isLettings ? LETTINGS_STATUSES : SALES_STATUSES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          {!isLettings && (
            <Field label="Closing Date">
              <input
                name="closing_date"
                type="date"
                defaultValue={property?.closing_date?.slice(0, 10) ?? ""}
                className={inputClass}
              />
            </Field>
          )}
        </div>
      )}

      <Field label="Viewing Conducted By">
        <select
          name="viewing_conducted_by"
          defaultValue={property?.viewing_conducted_by ?? "agency_staff"}
          className={inputClass}
        >
          {viewingConductedByOptions(isLettings).map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Viewing Notes">
        <textarea
          name="viewing_notes"
          rows={2}
          defaultValue={props.mode === "edit" ? (props.viewingNotes ?? "") : ""}
          className={inputClass}
        />
      </Field>

      <div className="rounded border border-border-hairline bg-cream p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          {isLettings ? "Landlord" : "Vendor"}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name">
            <input
              name="vendor_name"
              defaultValue={props.mode === "edit" ? props.vendorName : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="Phone">
            <input
              name="vendor_phone"
              defaultValue={props.mode === "edit" ? props.vendorPhone : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="Email">
            <input
              name="vendor_email"
              type="email"
              defaultValue={props.mode === "edit" ? props.vendorEmail : undefined}
              className={inputClass}
            />
          </Field>
        </div>
        <p className="mt-1 text-xs text-ink-faint">
          Matches an existing contact by phone number, or creates a new one.
        </p>
      </div>

      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer rounded bg-navy-900 px-4 py-2 text-sm font-medium text-cream hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Saving…" : props.mode === "create" ? "Create Listing" : "Save Changes"}
      </button>
    </form>
  );
}
