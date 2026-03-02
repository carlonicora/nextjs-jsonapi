"use client";

import { cn } from "../../../lib/utils";
import { CheckIcon, MinusIcon, XIcon } from "lucide-react";
import { Badge, Tooltip, TooltipContent, TooltipTrigger } from "../../../shadcnui";
import { PermissionValue } from "../data/RbacTypes";

interface RbacPermissionCellProps {
  value: PermissionValue | undefined | null;
  originalValue?: PermissionValue | undefined | null;
  isRoleColumn?: boolean;
  onClick?: () => void;
}

export default function RbacPermissionCell({
  value,
  originalValue,
  isRoleColumn = false,
  onClick,
}: RbacPermissionCellProps) {
  const isDirty = originalValue !== undefined && value !== originalValue;

  // null or undefined in role column = inherit from default (show dash)
  if (isRoleColumn && (value === null || value === undefined)) {
    return (
      <div
        onClick={onClick}
        className={cn(
          "flex h-8 w-full items-center justify-center rounded px-2 transition-colors hover:bg-muted cursor-pointer",
          isDirty && "ring-2 ring-amber-400/50",
        )}
      >
        <MinusIcon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    );
  }

  if (value === true) {
    return (
      <div
        onClick={onClick}
        className={cn(
          "flex h-8 w-full items-center justify-center rounded px-2 transition-colors hover:bg-muted cursor-pointer",
          isDirty && "ring-2 ring-amber-400/50",
        )}
      >
        <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 gap-1 text-xs">
          <CheckIcon className="h-3 w-3" />
          <span>true</span>
        </Badge>
      </div>
    );
  }

  if (value === false) {
    return (
      <div
        onClick={onClick}
        className={cn(
          "flex h-8 w-full items-center justify-center rounded px-2 transition-colors hover:bg-muted cursor-pointer",
          isDirty && "ring-2 ring-amber-400/50",
        )}
      >
        <Badge variant="destructive" className="gap-1 text-xs">
          <XIcon className="h-3 w-3" />
          <span>false</span>
        </Badge>
      </div>
    );
  }

  // String value (relationship path)
  const displayValue = typeof value === "string" ? value : String(value);
  const truncated = displayValue.length > 20 ? displayValue.substring(0, 18) + "..." : displayValue;

  return (
    <Tooltip>
      <TooltipTrigger
        onClick={onClick}
        className={cn(
          "flex h-8 w-full items-center justify-center rounded px-2 transition-colors hover:bg-muted cursor-pointer",
          isDirty && "ring-2 ring-amber-400/50",
        )}
        render={<div />}
      >
        <Badge variant="outline" className="max-w-full truncate text-xs font-mono">
          {truncated}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="font-mono text-xs break-all">{displayValue}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export { RbacPermissionCell };
