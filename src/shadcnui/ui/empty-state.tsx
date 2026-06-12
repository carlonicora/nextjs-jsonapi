import type { LucideIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = React.ComponentProps<"div"> & {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

function EmptyState({ icon: Icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn("flex flex-col items-center justify-center gap-1.5 rounded-md p-6 text-center", className)}
      {...props}
    >
      {Icon && (
        <div className="bg-muted text-muted-foreground mb-1 inline-flex size-8 items-center justify-center rounded-md">
          <Icon className="size-4" />
        </div>
      )}
      <div className="text-sm font-medium">{title}</div>
      {description && <div className="text-muted-foreground text-xs/relaxed">{description}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export { EmptyState };
