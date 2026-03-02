"use client";

import { cn } from "../../../lib/utils";
import { CheckIcon, MinusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Button, Checkbox, Input, Popover, PopoverContent, PopoverTrigger, Separator } from "../../../shadcnui";
import { PermissionValue } from "../data/RbacTypes";
import RbacPermissionCell from "./RbacPermissionCell";

interface RbacPermissionPickerProps {
  value: PermissionValue | undefined | null;
  originalValue?: PermissionValue | undefined | null;
  isRoleColumn?: boolean;
  knownSegments: string[];
  onSetValue: (value: PermissionValue) => void;
  onClear?: () => void;
}

export default function RbacPermissionPicker({
  value,
  originalValue,
  isRoleColumn = false,
  knownSegments,
  onSetValue,
  onClear,
}: RbacPermissionPickerProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [customSegment, setCustomSegment] = useState("");

  // Parse current segments from value if it's a string
  const currentSegments: string[] = typeof value === "string" ? value.split("|").filter(Boolean) : [];

  const toggleSegment = useCallback(
    (segment: string) => {
      const newSegments = currentSegments.includes(segment)
        ? currentSegments.filter((s) => s !== segment)
        : [...currentSegments, segment];

      if (newSegments.length === 0) {
        onSetValue(false);
      } else {
        onSetValue(newSegments.join("|"));
      }
    },
    [currentSegments, onSetValue],
  );

  const addCustomSegment = useCallback(() => {
    if (!customSegment.trim()) return;
    const segment = customSegment.trim();
    if (!currentSegments.includes(segment)) {
      const newSegments = [...currentSegments, segment];
      onSetValue(newSegments.join("|"));
    }
    setCustomSegment("");
  }, [customSegment, currentSegments, onSetValue]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <RbacPermissionCell value={value} originalValue={originalValue} isRoleColumn={isRoleColumn} />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="center">
        <div className="space-y-3">
          {/* Quick toggles */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">{t("rbac.quick_value")}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={value === true ? "default" : "outline"}
                className={cn("flex-1 gap-1", value === true && "bg-emerald-600 hover:bg-emerald-700")}
                onClick={() => {
                  onSetValue(true);
                  setOpen(false);
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
                  setOpen(false);
                }}
              >
                <XIcon className="h-3 w-3" />
                <span>false</span>
              </Button>
            </div>
          </div>

          {/* Clear / Inherit (role columns only) */}
          {isRoleColumn && onClear && (
            <>
              <Separator />
              <Button
                size="sm"
                variant="ghost"
                className="w-full gap-1 text-muted-foreground"
                onClick={() => {
                  onClear();
                  setOpen(false);
                }}
              >
                <MinusIcon className="h-3 w-3" />
                {t("rbac.inherit_from_defaults")}
              </Button>
            </>
          )}

          {/* Relationship path builder */}
          {knownSegments.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">{t("rbac.relationships")}</p>
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {knownSegments.map((segment) => (
                    <label
                      key={segment}
                      className="flex items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={currentSegments.includes(segment)}
                        onCheckedChange={() => toggleSegment(segment)}
                      />
                      <span className="font-mono text-xs">{segment}</span>
                    </label>
                  ))}
                </div>

                {/* Custom segment input */}
                <div className="mt-2 flex gap-1">
                  <Input
                    value={customSegment}
                    onChange={(e) => setCustomSegment(e.target.value)}
                    placeholder={t("rbac.custom_segment_placeholder")}
                    className="h-7 text-xs font-mono"
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

                {/* Preview */}
                {currentSegments.length > 0 && (
                  <div className="mt-2 rounded bg-muted p-2">
                    <p className="text-xs text-muted-foreground mb-1">{t("rbac.preview")}</p>
                    <p className="text-xs font-mono break-all">{currentSegments.join("|")}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { RbacPermissionPicker };
