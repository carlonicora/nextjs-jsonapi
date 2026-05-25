import { Modules } from "../../../../core";
import { ReactNode } from "react";

export function EntityRef({ type, children }: { type: string; children: ReactNode }) {
  let Icon: React.ComponentType<{ className?: string }> | null = null;
  try {
    const m = Modules.findByName(type);
    Icon = m.icon ?? null;
  } catch {
    Icon = null;
  }
  return (
    <span className="bg-muted text-foreground/90 inline-flex items-center gap-1 rounded px-1.5 py-0.5 align-middle text-xs">
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {children}
    </span>
  );
}
