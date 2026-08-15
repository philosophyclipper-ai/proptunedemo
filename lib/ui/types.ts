export type Contact = {
  id: string;
  name: string;
  roles: string[];
  phone_primary: string;
  phone_secondary: string | null;
  email: string | null;
  company: string | null;
  mortgage_status: MortgageStatus | null;
  property_ownership_status: BuyerPropertyStatus | null;
  created_at: string;
  updated_at: string;
};

export type Property = {
  ref: string;
  address_line1: string;
  address_line2: string | null;
  city: string | null;
  postcode: string;
  bedrooms: number | null;
  property_type: string | null;
  tenure: string | null;
  status: string;
  listing_type: "sales" | "lettings";
  price_qualifier: string | null;
  asking_price: number | null;
  home_report_value: number | null;
  home_report_url: string | null;
  rent_amount: number | null;
  rent_frequency: "monthly" | "weekly" | null;
  council_tax_band: string | null;
  epc_rating: string | null;
  vendor_contact_id: string | null;
  viewing_conducted_by: "vendor" | "viewing_agent" | "agency_staff";
  closing_date: string | null;
  went_live_at: string | null;
  negotiator_id: string | null;
  description: string | null;
  photos: string[];
  created_at: string;
  updated_at: string;
};

export type ViewingArrangement = {
  ref: string;
  conducted_by: "vendor" | "viewing_agent" | "agency_staff";
  viewing_notes: string | null;
  can_commit: boolean;
  free_slots: string[];
};

export type Valuation = {
  id: string;
  property_ref: string | null;
  contact_id: string;
  address_line1: string;
  address_line2: string | null;
  city: string | null;
  postcode: string;
  estimated_value: number | null;
  status: string;
  valuation_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type MortgageStatus = "not_required" | "mortgage_required" | "approved_in_principle";
export type BuyerPropertyStatus =
  | "first_time_buyer"
  | "chain_free"
  | "on_the_market"
  | "under_offer"
  | "sold";

export type Viewing = {
  id: string;
  property_ref: string | null;
  contact_id: string;
  status: "incomplete" | "requested" | "confirmed" | "cancelled" | "completed";
  proposed_times: string[] | null;
  scheduled_at: string | null;
  calendar_event_id: string | null;
  mortgage_status: MortgageStatus | null;
  buyer_property_status: BuyerPropertyStatus | null;
  created_at: string;
  updated_at: string;
};

export type Offer = {
  id: string;
  property_ref: string | null;
  contact_id: string;
  additional_contacts: { id: string; name: string; phone_primary: string }[];
  type: "note_of_interest" | "offer";
  amount: number | null;
  status: string;
  solicitor_contact_id: string | null;
  received_via: string | null;
  created_at: string;
  updated_at: string;
};

export type MaintenanceIssue = {
  id: string;
  property_ref: string | null;
  contact_id: string | null;
  description: string;
  status: string;
  urgency: string | null;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type Note = {
  id: string;
  entity_type?: string;
  entity_id?: string;
  author_type: "user" | "ai";
  author_user_id: string | null;
  body: string;
  created_at: string;
};

export type TimelineEntry = {
  id: string;
  kind: "note" | "viewing" | "valuation" | "offer" | "task" | "maintenance_issue";
  contact_id: string | null;
  author_type: "user" | "ai" | null;
  summary: string;
  occurred_at: string;
};
