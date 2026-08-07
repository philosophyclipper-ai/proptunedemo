export type Contact = {
  id: string;
  name: string;
  roles: string[];
  phone_primary: string;
  phone_secondary: string | null;
  email: string | null;
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
  price_qualifier: string | null;
  asking_price: number | null;
  home_report_value: number | null;
  home_report_url: string | null;
  council_tax_band: string | null;
  epc_rating: string | null;
  vendor_contact_id: string | null;
  viewing_conducted_by: "vendor" | "viewing_agent" | "agency_staff";
  closing_date: string | null;
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

export type Viewing = {
  id: string;
  property_ref: string | null;
  contact_id: string;
  status: "requested" | "confirmed" | "cancelled" | "completed";
  proposed_times: string[] | null;
  scheduled_at: string | null;
  calendar_event_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Offer = {
  id: string;
  property_ref: string | null;
  contact_id: string;
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
