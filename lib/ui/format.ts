const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

export function formatPrice(property: {
  price_qualifier: string | null;
  asking_price: number | null;
}): string {
  if (!property.asking_price || property.price_qualifier === "poa") {
    return "POA";
  }

  const amount = gbp.format(property.asking_price);
  switch (property.price_qualifier) {
    case "offers_over":
      return `Offers Over ${amount}`;
    case "fixed_price":
      return `Fixed Price ${amount}`;
    case "offers_around":
      return `Offers Around ${amount}`;
    case "offers_in_region_of":
      return `Offers in the Region of ${amount}`;
    default:
      return amount;
  }
}

export function formatMoney(amount: number | null): string {
  if (amount == null) return "—";
  return gbp.format(amount);
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAddress(property: {
  address_line1: string;
  address_line2?: string | null;
  city?: string | null;
  postcode: string;
}): string {
  return [property.address_line1, property.address_line2, property.city, property.postcode]
    .filter(Boolean)
    .join(", ");
}

export function titleCase(value: string | null): string {
  if (!value) return "—";
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
