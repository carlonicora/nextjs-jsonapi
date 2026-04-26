"use client";

interface Props {
  /** 0-1 (decimal) or 0-100 (percent). Auto-detected. */
  value: number;
  className?: string;
}

export function RelevanceMeter({ value, className = "" }: Props) {
  const pct = Math.max(0, Math.min(100, value <= 1 ? value * 100 : value));
  const label = `${Math.round(pct)}%`;
  return (
    <div
      role="meter"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Relevance ${label}`}
      className={`bg-muted relative mx-auto flex h-5 w-20 items-center justify-center overflow-hidden rounded border ${className}`}
    >
      <div className="bg-accent absolute top-0 left-0 h-full" style={{ width: `${pct}%` }} />
      <span
        className={`relative text-xs ${pct < 40 ? "text-muted-foreground" : "text-accent-foreground font-semibold"}`}
      >
        {label}
      </span>
    </div>
  );
}
