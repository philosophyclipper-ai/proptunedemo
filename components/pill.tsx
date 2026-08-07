import type { Tone } from "@/lib/ui/status-tone";

const TONE_CLASSES: Record<Tone, string> = {
  green: "bg-green-tint text-green-600",
  amber: "bg-amber-tint text-amber-600",
  red: "bg-red-tint text-red-600",
  gray: "bg-gray-tint text-ink-muted",
  navy: "bg-navy-800 text-cream",
};

export function Pill({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  );
}
