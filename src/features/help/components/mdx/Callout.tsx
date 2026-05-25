import { InfoIcon, AlertTriangleIcon, LightbulbIcon, XCircleIcon, LucideIcon } from "lucide-react";
import { ReactNode } from "react";

type CalloutType = "info" | "warning" | "tip" | "danger";

const STYLES: Record<CalloutType, { icon: LucideIcon; ring: string }> = {
  info: { icon: InfoIcon, ring: "ring-blue-500/30 bg-blue-500/5" },
  warning: { icon: AlertTriangleIcon, ring: "ring-amber-500/30 bg-amber-500/5" },
  tip: { icon: LightbulbIcon, ring: "ring-emerald-500/30 bg-emerald-500/5" },
  danger: { icon: XCircleIcon, ring: "ring-rose-500/30 bg-rose-500/5" },
};

export function Callout({ type = "info", children }: { type?: CalloutType; children: ReactNode }) {
  const { icon: Icon, ring } = STYLES[type];
  return (
    <div className={`my-4 flex gap-3 rounded-md ring-1 p-3 ${ring}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}
