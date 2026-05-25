import { ReactNode } from "react";
export function KeyBinding({ children }: { children: ReactNode }) {
  return (
    <kbd className="bg-muted text-muted-foreground rounded border px-1.5 py-0.5 text-xs font-medium">{children}</kbd>
  );
}
