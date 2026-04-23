"use client";

import { RoundPageContainer } from "@/components";
import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRbacContext } from "../contexts/RbacContext";
import {
  ACTION_TYPES,
  ActionType,
  PermissionValue,
  type PermToken,
  type RbacModuleBlock,
} from "../data/RbacTypes";
import RbacPermissionCell from "./RbacPermissionCell";
import { RbacPermissionPicker } from "./RbacPermissionPicker";

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function findToken(tokens: PermToken[] | undefined, action: ActionType): PermToken | undefined {
  if (!tokens) return undefined;
  return tokens.find((t) => t.action === action);
}

function cellValue(tokens: PermToken[] | undefined, action: ActionType): PermissionValue | undefined {
  const tok = findToken(tokens, action);
  if (!tok) return undefined;
  return tok.scope;
}

// ---------------------------------------------------------------------------
// Picker target state
// ---------------------------------------------------------------------------

interface ActivePicker {
  moduleId: string;
  rowKey: string; // "default" or a role UUID
  action: ActionType;
  isRoleColumn: boolean;
  anchor: HTMLElement;
}

// ---------------------------------------------------------------------------
// Cell trigger — pure display + a click handler that opens the global picker.
// Memoised so unchanged cells don't re-render.
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Single-module editor — renders exactly one module's table.
// Memoised on its inputs so sidebar re-renders (e.g. new selectedModuleId)
// don't re-render the editor when the editor's module-level data hasn't
// changed.
// ---------------------------------------------------------------------------

const ACTION_LABELS: Record<ActionType, string> = {
  read: "Read",
  create: "Create",
  update: "Update",
  delete: "Delete",
};

interface ModuleEditorProps {
  moduleId: string;
  block: RbacModuleBlock;
  moduleLabel: string;
  roleIds: string[];
  roleNames?: Record<string, string>;
  onOpenPicker: (picker: ActivePicker) => void;
}

const ModuleEditor = memo(function ModuleEditor({
  moduleId,
  block,
  moduleLabel,
  roleIds,
  roleNames,
  onOpenPicker,
}: ModuleEditorProps) {
  const t = useTranslations();
  const defaultTokens = block.default ?? [];

  return (
    <div className="rounded-lg border border-accent bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h4 className="text-sm font-medium">{moduleLabel}</h4>
        <span className="font-mono text-[10px] text-muted-foreground">{moduleId}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="w-40 px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                {t("rbac.role")}
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
            {/* Defaults row */}
            <tr className={cn("border-b bg-muted/30")}>
              <td className="px-4 py-1 text-xs font-bold text-muted-foreground">
                {t("rbac.defaults")}
              </td>
              {ACTION_TYPES.map((action) => (
                <td key={action} className="px-2 py-1">
                  <CellButton
                    moduleId={moduleId}
                    rowKey="default"
                    action={action}
                    tokens={defaultTokens}
                    isRoleColumn={false}
                    onOpen={onOpenPicker}
                  />
                </td>
              ))}
            </tr>

            {/* Role rows */}
            {roleIds.map((roleId) => {
              const roleTokens = (block as Record<string, PermToken[]>)[roleId];
              const roleLabel = roleNames?.[roleId] ?? roleId;
              return (
                <tr key={roleId} className="border-b last:border-b-0">
                  <td className="px-4 py-1 text-xs font-medium text-muted-foreground">
                    {roleLabel}
                  </td>
                  {ACTION_TYPES.map((action) => (
                    <td key={action} className="px-2 py-1">
                      <CellButton
                        moduleId={moduleId}
                        rowKey={roleId}
                        action={action}
                        tokens={roleTokens}
                        isRoleColumn={true}
                        onOpen={onOpenPicker}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Container — sidebar (module list) + detail (single module editor) + one
// global picker.
// ---------------------------------------------------------------------------

export default function RbacContainer() {
  const t = useTranslations();
  const {
    matrix,
    modulePaths,
    loading,
    error,
    roleNames,
    moduleNames,
    updateCell,
    clearCell,
  } = useRbacContext();

  // Which module is visible in the right pane.
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // Which cell the single global picker is currently anchored to.
  const [activePicker, setActivePicker] = useState<ActivePicker | null>(null);

  const openPicker = useCallback((picker: ActivePicker) => {
    setActivePicker(picker);
  }, []);

  const closePicker = useCallback(() => {
    setActivePicker(null);
  }, []);

  const handleSelectModule = useCallback((id: string) => {
    setSelectedModuleId(id);
    setActivePicker(null); // stale anchor once we switch modules
  }, []);

  /** Module IDs sorted by display name (fallback to UUID). */
  const sortedModuleIds = useMemo(() => {
    if (!matrix) return [];
    return Object.keys(matrix).sort((a, b) =>
      (moduleNames?.[a] ?? a).localeCompare(moduleNames?.[b] ?? b),
    );
  }, [matrix, moduleNames]);

  /**
   * All role IDs to render as rows. When `roleNames` is provided (normal app
   * path), use its full key set so every role appears — not just roles that
   * already have an entry in the matrix. Sorted by display name.
   */
  const roleIds = useMemo(() => {
    if (roleNames) {
      return Object.keys(roleNames).sort((a, b) =>
        (roleNames[a] ?? a).localeCompare(roleNames[b] ?? b),
      );
    }
    if (!matrix) return [];
    const set = new Set<string>();
    for (const moduleId of Object.keys(matrix)) {
      for (const key of Object.keys(matrix[moduleId] ?? {})) {
        if (key !== "default") set.add(key);
      }
    }
    return Array.from(set).sort();
  }, [matrix, roleNames]);

  // Auto-select the first module once the matrix loads.
  useEffect(() => {
    if (!selectedModuleId && sortedModuleIds.length > 0) {
      setSelectedModuleId(sortedModuleIds[0]);
    }
  }, [selectedModuleId, sortedModuleIds]);

  // --- Picker-driven values ---------------------------------------------------

  const activeValue = useMemo<PermissionValue | undefined>(() => {
    if (!activePicker || !matrix) return undefined;
    const block = matrix[activePicker.moduleId];
    if (!block) return undefined;
    const tokens =
      activePicker.rowKey === "default"
        ? block.default
        : (block as Record<string, PermToken[]>)[activePicker.rowKey];
    return cellValue(tokens, activePicker.action);
  }, [activePicker, matrix]);

  const activeSegments = useMemo<string[]>(() => {
    if (!activePicker) return [];
    return (modulePaths[activePicker.moduleId] as string[] | undefined) ?? [];
  }, [activePicker, modulePaths]);

  // Update-only: whether to ALSO close the picker is the picker's decision
  // (quick true/false + "inherit" close via the picker's own onClose; checkbox
  // toggles do NOT close so users can pick multiple relationship paths).
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

  // --- Transient-state returns ------------------------------------------------

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

  if (!matrix) return null;

  const selectedBlock: RbacModuleBlock | undefined = selectedModuleId
    ? matrix[selectedModuleId]
    : undefined;

  return (
    <RoundPageContainer fullWidth forceHeader>
      <div className="flex h-full w-full">
        {/* Sidebar: module list */}
        <aside className="w-60 shrink-0 overflow-y-auto border-r bg-muted/20">
          <ul className="py-1">
            {sortedModuleIds.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => handleSelectModule(id)}
                  aria-current={id === selectedModuleId ? "true" : undefined}
                  className={cn(
                    "block w-full px-4 py-1.5 text-left text-sm hover:bg-muted",
                    id === selectedModuleId && "bg-muted font-medium text-foreground",
                    id !== selectedModuleId && "text-muted-foreground",
                  )}
                >
                  {moduleNames?.[id] ?? id}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Detail: one module's editor */}
        <section className="flex-1 overflow-y-auto p-4">
          {selectedModuleId && selectedBlock ? (
            <ModuleEditor
              moduleId={selectedModuleId}
              block={selectedBlock}
              moduleLabel={moduleNames?.[selectedModuleId] ?? selectedModuleId}
              roleIds={roleIds}
              roleNames={roleNames}
              onOpenPicker={openPicker}
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              {t("rbac.select_module_prompt")}
            </p>
          )}
        </section>
      </div>

      {/* One global picker for the whole container. */}
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

export { RbacContainer };
