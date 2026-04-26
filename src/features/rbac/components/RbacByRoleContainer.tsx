"use client";

import { RoundPageContainer } from "@/components";
import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRbacContext } from "../contexts/RbacContext";
import { ACTION_TYPES, ActionType, PermissionValue, type PermToken } from "../data/RbacTypes";
import RbacPermissionCell from "./RbacPermissionCell";
import { RbacPermissionPicker } from "./RbacPermissionPicker";

function findToken(tokens: PermToken[] | undefined, action: ActionType): PermToken | undefined {
  if (!tokens) return undefined;
  return tokens.find((t) => t.action === action);
}

function cellValue(tokens: PermToken[] | undefined, action: ActionType): PermissionValue | undefined {
  const tok = findToken(tokens, action);
  if (!tok) return undefined;
  return tok.scope;
}

interface ActivePicker {
  moduleId: string;
  rowKey: string;
  action: ActionType;
  isRoleColumn: boolean;
  anchor: HTMLElement;
}

interface CellButtonProps {
  moduleId: string;
  rowKey: string;
  action: ActionType;
  tokens: PermToken[] | undefined;
  isRoleColumn: boolean;
  onOpen: (picker: ActivePicker) => void;
}

const CellButton = memo(function CellButton({
  moduleId,
  rowKey,
  action,
  tokens,
  isRoleColumn,
  onOpen,
}: CellButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const value = cellValue(tokens, action);

  const handleClick = useCallback(() => {
    if (!ref.current) return;
    onOpen({ moduleId, rowKey, action, isRoleColumn, anchor: ref.current });
  }, [onOpen, moduleId, rowKey, action, isRoleColumn]);

  return (
    <div ref={ref}>
      <RbacPermissionCell value={value} isRoleColumn={isRoleColumn} onClick={handleClick} />
    </div>
  );
});

const ACTION_LABELS: Record<ActionType, string> = {
  read: "Read",
  create: "Create",
  update: "Update",
  delete: "Delete",
};

export default function RbacByRoleContainer() {
  const t = useTranslations();
  const { matrix, modulePaths, loading, error, roleNames, moduleNames, updateCell, clearCell } = useRbacContext();

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [activePicker, setActivePicker] = useState<ActivePicker | null>(null);

  const openPicker = useCallback((picker: ActivePicker) => {
    setActivePicker(picker);
  }, []);

  const closePicker = useCallback(() => {
    setActivePicker(null);
  }, []);

  const handleSelectRole = useCallback((id: string) => {
    setSelectedRoleId(id);
    setActivePicker(null);
  }, []);

  const sortedRoleIds = useMemo(() => {
    if (!roleNames) return [];
    return Object.keys(roleNames).sort((a, b) => (roleNames[a] ?? a).localeCompare(roleNames[b] ?? b));
  }, [roleNames]);

  const sortedModuleIds = useMemo(() => {
    if (!matrix) return [];
    return Object.keys(matrix).sort((a, b) => (moduleNames?.[a] ?? a).localeCompare(moduleNames?.[b] ?? b));
  }, [matrix, moduleNames]);

  useEffect(() => {
    if (!selectedRoleId && sortedRoleIds.length > 0) {
      setSelectedRoleId(sortedRoleIds[0]);
    }
  }, [selectedRoleId, sortedRoleIds]);

  const activeValue = useMemo<PermissionValue | undefined>(() => {
    if (!activePicker || !matrix) return undefined;
    const block = matrix[activePicker.moduleId];
    if (!block) return undefined;
    const tokens =
      activePicker.rowKey === "default" ? block.default : (block as Record<string, PermToken[]>)[activePicker.rowKey];
    return cellValue(tokens, activePicker.action);
  }, [activePicker, matrix]);

  const activeSegments = useMemo<string[]>(() => {
    if (!activePicker) return [];
    return (modulePaths[activePicker.moduleId] as string[] | undefined) ?? [];
  }, [activePicker, modulePaths]);

  const handleSetValue = useCallback(
    (value: PermissionValue) => {
      if (!activePicker) return;
      updateCell(activePicker.moduleId, activePicker.rowKey, activePicker.action, value);
    },
    [activePicker, updateCell],
  );

  const handleClear = useCallback(() => {
    if (!activePicker || !activePicker.isRoleColumn) return;
    clearCell(activePicker.moduleId, activePicker.rowKey, activePicker.action);
  }, [activePicker, clearCell]);

  if (loading) {
    return (
      <RoundPageContainer fullWidth>
        <div className="flex h-full items-center justify-center">
          <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </RoundPageContainer>
    );
  }

  if (error) {
    return (
      <RoundPageContainer fullWidth>
        <div className="flex h-full items-center justify-center">
          <p className="text-destructive">{error}</p>
        </div>
      </RoundPageContainer>
    );
  }

  if (!matrix || !selectedRoleId) return null;

  return (
    <RoundPageContainer fullWidth forceHeader>
      <div className="flex h-full w-full">
        <aside className="w-60 shrink-0 overflow-y-auto border-r bg-muted/20">
          <ul className="py-1">
            {sortedRoleIds.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => handleSelectRole(id)}
                  aria-current={id === selectedRoleId ? "true" : undefined}
                  className={cn(
                    "block w-full px-4 py-1.5 text-left text-sm hover:bg-muted",
                    id === selectedRoleId && "bg-muted font-medium text-foreground",
                    id !== selectedRoleId && "text-muted-foreground",
                  )}
                >
                  {roleNames?.[id] ?? id}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="flex-1 overflow-y-auto p-4">
          {sortedModuleIds.length > 0 ? (
            <div className="rounded-lg border border-accent bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b bg-muted/80 backdrop-blur-sm">
                      <th className="w-40 px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                        {t("rbac.module")}
                      </th>
                      {ACTION_TYPES.map((action) => (
                        <th
                          key={action}
                          className="min-w-28 px-2 py-2 text-center text-xs font-medium text-muted-foreground"
                        >
                          {ACTION_LABELS[action]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedModuleIds.map((moduleId) => {
                      const block = matrix[moduleId];
                      if (!block) return null;
                      const defaultTokens = block.default ?? [];
                      const roleTokens = (block as Record<string, PermToken[]>)[selectedRoleId];
                      const moduleLabel = moduleNames?.[moduleId] ?? moduleId;

                      return (
                        <Fragment key={moduleId}>
                          <tr className="border-b bg-muted/40">
                            <td
                              colSpan={ACTION_TYPES.length + 1}
                              className="px-4 py-1.5 text-xs font-bold text-muted-foreground"
                            >
                              {moduleLabel}
                            </td>
                          </tr>
                          <tr className="border-b bg-muted/20">
                            <td className="px-4 py-1 text-xs text-muted-foreground">{t("rbac.defaults")}</td>
                            {ACTION_TYPES.map((action) => (
                              <td key={action} className="px-2 py-1">
                                <RbacPermissionCell value={cellValue(defaultTokens, action)} />
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b last:border-b-0">
                            <td className="px-4 py-1 text-xs font-medium text-muted-foreground">
                              {roleNames?.[selectedRoleId] ?? selectedRoleId}
                            </td>
                            {ACTION_TYPES.map((action) => (
                              <td key={action} className="px-2 py-1">
                                <CellButton
                                  moduleId={moduleId}
                                  rowKey={selectedRoleId}
                                  action={action}
                                  tokens={roleTokens}
                                  isRoleColumn={true}
                                  onOpen={openPicker}
                                />
                              </td>
                            ))}
                          </tr>
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t("rbac.select_role_prompt")}</p>
          )}
        </section>
      </div>

      <RbacPermissionPicker
        open={!!activePicker}
        anchor={activePicker?.anchor ?? null}
        value={activeValue}
        isRoleColumn={activePicker?.isRoleColumn ?? false}
        knownSegments={activeSegments}
        onSetValue={handleSetValue}
        onClear={activePicker?.isRoleColumn ? handleClear : undefined}
        onClose={closePicker}
      />
    </RoundPageContainer>
  );
}

export { RbacByRoleContainer };
