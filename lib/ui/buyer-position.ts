// Shared vocabulary for a buyer's mortgage readiness and their own
// property's chain status. Used both per-viewing (a snapshot captured at
// booking time) and on the contact record itself (their current position,
// visible/editable from the Contacts section and from any viewing they're
// attached to).

export const MORTGAGE_STATUS_OPTIONS = [
  { value: "not_required", label: "Not Required" },
  { value: "mortgage_required", label: "Mortgage Required" },
  { value: "approved_in_principle", label: "Approved in Principle" },
];

export const PROPERTY_OWNERSHIP_STATUS_OPTIONS = [
  { value: "first_time_buyer", label: "First Time Buyer" },
  { value: "chain_free", label: "Chain Free" },
  { value: "on_the_market", label: "On the Market" },
  { value: "under_offer", label: "Under Offer" },
  { value: "sold", label: "Sold" },
];

export const MORTGAGE_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  MORTGAGE_STATUS_OPTIONS.map((o) => [o.value, o.label])
);

export const PROPERTY_OWNERSHIP_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  PROPERTY_OWNERSHIP_STATUS_OPTIONS.map((o) => [o.value, o.label])
);
