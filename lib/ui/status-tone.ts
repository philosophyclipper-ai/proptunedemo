export type Tone = "green" | "amber" | "red" | "gray" | "navy";

export function propertyStatusTone(status: string): Tone {
  switch (status) {
    case "available":
    case "on_market":
      return "green";
    case "under_offer":
      return "amber";
    case "sold":
    case "let":
      return "navy";
    default:
      return "gray"; // withdrawn
  }
}

export function viewingStatusTone(status: string): Tone {
  switch (status) {
    case "confirmed":
      return "green";
    case "requested":
      return "amber";
    case "incomplete":
      return "red";
    case "completed":
      return "navy";
    default:
      return "gray"; // cancelled
  }
}

export function offerStatusTone(status: string): Tone {
  switch (status) {
    case "accepted":
      return "green";
    case "open":
    case "countered":
      return "amber";
    case "rejected":
      return "red";
    default:
      return "gray"; // withdrawn
  }
}

export function maintenanceStatusTone(status: string): Tone {
  switch (status) {
    case "resolved":
      return "green";
    case "in_progress":
      return "amber";
    case "reported":
      return "red";
    default:
      return "gray";
  }
}

export function urgencyTone(urgency: string | null): Tone {
  switch (urgency) {
    case "emergency":
      return "red";
    case "high":
      return "amber";
    case "low":
      return "gray";
    default:
      return "navy"; // normal
  }
}
