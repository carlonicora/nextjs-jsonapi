"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { CheckIcon, MinusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { cn } from "../../../lib/utils";
import { Button, Checkbox, Input, Separator } from "../../../shadcnui";
import { PermissionValue } from "../data/RbacTypes";

/**
 * Controlled "global" picker. Exactly ONE instance is rendered by
 * `RbacContainer`; the container holds `activePicker` state and drives this
 * component's `open` + `anchor` props. Cells themselves are plain clickable
 * elements — they just open this picker at their own DOM position.
 *
 * This replaces the previous design that mounted one `<Popover>` per cell
 * (~2,600 total), which was both slow AND caused unreliable click handling
 * across overlapping outside-click listeners.
 */
interface RbacPermissionPickerProps {
  /** Whether the picker is open. Driven by `activePicker !== null` in the container. */
  open: boolean;
  /** DOM element the popup should anchor to. Required when `open`. */
  anchor: HTMLElement | null;
  /** Current effective value of the active cell (true | string | false | undefined). */
  value: PermissionValue | undefined;
  /** True if the active cell is in a role row (enables the "inherit from defaults" button). */
  isRoleColumn: boolean;
  /** Relationship paths the backend reports for the active cell's module. */
  knownSegments: string[];
  onSetValue: (value: PermissionValue) => void;
  /** Only meaningful for role rows — clears the token so the row inherits defaults. */
  onClear?: () => void;
  /** Called when the picker should close (outside-click, ESC, etc.). */
  onClose: () => void;
}

export function RbacPermissionPicker({
  open,
  anchor,
  value,
  isRoleColumn,
  knownSegments,
  onSetValue,
  onClear,
  onClose,
}: RbacPermissionPickerProps) {
  const t = useTranslations();
  const [customSegment, setCustomSegment] = useState("");

  // Reset the custom-segment input when the picker is reopened for a different cell.
  useEffect(() => {
    if (!open) setCustomSegment("");
  }, [open]);

  const currentSegments: string[] =
    typeof value === "string" ? value.split("|").filter(Boolean) : [];

  const toggleSegment = useCallback(
    (segment: string) => {
      const next = currentSegments.includes(segment)
        ? currentSegments.filter((s) => s !== segment)
        : [...currentSegments, segment];
      if (next.length === 0) onSetValue(false);
      else onSetValue(next.join("|"));
    },
    [currentSegments, onSetValue],
  );

  const addCustomSegment = useCallback(() => {
    const segment = customSegment.trim();
    if (!segment) return;
    if (!currentSegments.includes(segment)) {
      onSetValue([...currentSegments, segment].join("|"));
    }
    setCustomSegment("");
  }, [customSegment, currentSegments, onSetValue]);

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          anchor={anchor ?? undefined}
          side="bottom"
          align="center"
          sideOffset={4}
          className="isolate z-50"
        >
          <PopoverPrimitive.Popup
            className="bg-popover text-popover-foreground ring-foreground/10 z-50 flex w-96 flex-col gap-3 rounded-lg p-3 text-xs shadow-md outline-hidden ring-1 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 duration-100"
          >
            {/* Quick value */}
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium">
                {t("rbac.quick_value")}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={value === true ? "default" : "outline"}
                  className={cn(
                    "flex-1 gap-1",
                    value === true && "bg-emerald-600 hover:bg-emerald-700",
                  )}
                  onClick={() => {
                    onSetValue(true);
                    onClose();
                  }}
                >
                  <CheckIcon className="h-3 w-3" />
                  <span>true</span>
                </Button>
                <Button
                  size="sm"
                  variant={value === false ? "destructive" : "outline"}
                  className="flex-1 gap-1"
                  onClick={() => {
                    onSetValue(false);
                    onClose();
                  }}
                >
                  <XIcon className="h-3 w-3" />
                  <span>false</span>
                </Button>
              </div>
            </div>

            {/* Inherit from defaults — role rows only */}
            {isRoleColumn && onClear && (
              <>
                <Separator />
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground w-full gap-1"
                  onClick={() => {
                    onClear();
                    onClose();
                  }}
                >
                  <MinusIcon className="h-3 w-3" />
                  {t("rbac.inherit_from_defaults")}
                </Button>
              </>
            )}

            {/* Relationship-path builder — always visible so users can type custom paths */}
            <Separator />
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium">
                {t("rbac.relationships")}
              </p>
              {knownSegments.length > 0 && (
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {knownSegments.map((segment) => (
                    <label
                      key={segment}
                      className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm"
                    >
                      <Checkbox
                        checked={currentSegments.includes(segment)}
                        onCheckedChange={() => toggleSegment(segment)}
                      />
                      <span className="font-mono text-xs">{segment}</span>
                    </label>
                  ))}
                </div>
              )}
              <div className="mt-2 flex gap-1">
                <Input
                  value={customSegment}
                  onChange={(e) => setCustomSegment(e.target.value)}
                  placeholder={t("rbac.custom_segment_placeholder")}
                  className="h-7 font-mono text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomSegment();
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  onClick={addCustomSegment}
                  disabled={!customSegment.trim()}
                >
                  +
                </Button>
              </div>
              {currentSegments.length > 0 && (
                <div className="bg-muted mt-2 rounded p-2">
                  <p className="text-muted-foreground mb-1 text-xs">
                    {t("rbac.preview")}
                  </p>
                  <p className="font-mono text-xs break-all">
                    {currentSegments.join("|")}
                  </p>
                </div>
              )}
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export default RbacPermissionPicker;
