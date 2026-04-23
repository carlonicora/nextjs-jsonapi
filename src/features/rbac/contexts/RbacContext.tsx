"use client";

import { DownloadIcon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { SharedProvider } from "../../../contexts";
import { Modules } from "../../../core";
import { usePageUrlGenerator } from "../../../hooks";
import { BreadcrumbItemData } from "../../../interfaces";
import { Button } from "../../../shadcnui";
import { showError, showToast } from "../../../utils/toast";
import { RbacService } from "../data/RbacService";
import type {
  ActionType,
  PermissionValue,
  PermToken,
  RbacMatrix,
  RbacModuleBlock,
} from "../data/RbacTypes";

const DEFAULT_OUTPUT_PATH = "apps/api/src/rbac/permissions.ts";

function upsertToken(
  tokens: PermToken[] | undefined,
  action: ActionType,
  scope: PermissionValue,
): PermToken[] {
  const next = (tokens ?? []).filter((t) => t.action !== action);
  // `scope === false` has no representation in the matrix — absence of a
  // token for an action IS the "deny" semantics. See RbacContainer helpers.
  if (scope === false) return next;
  next.push({ action, scope });
  return next;
}

function removeToken(tokens: PermToken[] | undefined, action: ActionType): PermToken[] {
  return (tokens ?? []).filter((t) => t.action !== action);
}

interface RbacContextType {
  matrix: RbacMatrix | null;
  modulePaths: Record<string, readonly string[]>;
  loading: boolean;
  error: string | null;
  saving: boolean;
  roleNames?: Record<string, string>;
  moduleNames?: Record<string, string>;
  updateCell: (
    moduleId: string,
    rowKey: "default" | string,
    action: ActionType,
    value: PermissionValue,
  ) => void;
  clearCell: (moduleId: string, roleId: string, action: ActionType) => void;
}

const RbacContext = createContext<RbacContextType | undefined>(undefined);

type RbacProviderProps = {
  children: ReactNode;
  /** UUID → PascalCase map for roles (e.g. from `@neural-erp/shared`'s `RoleId`). */
  roleNames?: Record<string, string>;
  /** UUID → PascalCase map for modules (e.g. from `@neural-erp/shared`'s `ModuleId`). */
  moduleNames?: Record<string, string>;
  /**
   * Output path for the serialized `permissions.ts` file. Absolute, or
   * relative to the API's repo root. Defaults to
   * `"apps/api/src/rbac/permissions.ts"`.
   */
  outputPath?: string;
};

/**
 * RbacProvider — owns the matrix state, the save handler, and the breadcrumb +
 * title wiring. Renders the "Save to permissions.ts" button into
 * `title.functions` so it appears in the page header, following the same
 * convention as CompanyContext / other context providers in this codebase.
 *
 * The child `RbacContainer` is stateless — it consumes state via
 * `useRbacContext()`.
 */
export const RbacProvider = ({
  children,
  roleNames,
  moduleNames,
  outputPath = DEFAULT_OUTPUT_PATH,
}: RbacProviderProps) => {
  const generateUrl = usePageUrlGenerator();
  const t = useTranslations();

  const [matrix, setMatrix] = useState<RbacMatrix | null>(null);
  const [modulePaths, setModulePaths] = useState<Record<string, readonly string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    RbacService.fetchMatrix()
      .then((result) => {
        if (cancelled) return;
        setMatrix(result.matrix);
        setModulePaths(result.modulePaths);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load RBAC matrix:", err);
        setError(t("rbac.loading_error"));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const updateCell = useCallback<RbacContextType["updateCell"]>(
    (moduleId, rowKey, action, value) => {
      setMatrix((prev) => {
        if (!prev) return prev;
        const prevBlock: RbacModuleBlock = prev[moduleId] ?? { default: [] };
        const prevTokens: PermToken[] | undefined =
          rowKey === "default" ? prevBlock.default : (prevBlock as Record<string, PermToken[]>)[rowKey];
        const nextTokens = upsertToken(prevTokens, action, value);
        const nextBlock: RbacModuleBlock = { ...prevBlock, [rowKey]: nextTokens } as RbacModuleBlock;
        return { ...prev, [moduleId]: nextBlock };
      });
    },
    [],
  );

  const clearCell = useCallback<RbacContextType["clearCell"]>((moduleId, roleId, action) => {
    setMatrix((prev) => {
      if (!prev) return prev;
      const prevBlock: RbacModuleBlock = prev[moduleId] ?? { default: [] };
      const prevTokens: PermToken[] | undefined = (prevBlock as Record<string, PermToken[]>)[roleId];
      if (!prevTokens || prevTokens.length === 0) return prev;
      const nextTokens = removeToken(prevTokens, action);
      const nextBlock: RbacModuleBlock = { ...prevBlock } as RbacModuleBlock;
      if (nextTokens.length === 0) {
        delete (nextBlock as Record<string, PermToken[]>)[roleId];
      } else {
        (nextBlock as Record<string, PermToken[]>)[roleId] = nextTokens;
      }
      return { ...prev, [moduleId]: nextBlock };
    });
  }, []);

  const canSave = Boolean(roleNames && moduleNames && matrix && !saving);

  const handleSave = useCallback(async () => {
    if (!matrix || !roleNames || !moduleNames) return;
    setSaving(true);
    try {
      await RbacService.saveMatrix({ matrix, roleNames, moduleNames, outputPath });
      showToast(`Saved to ${outputPath}`);
    } catch (err) {
      console.error("Failed to save RBAC matrix:", err);
      showError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }, [matrix, roleNames, moduleNames, outputPath]);

  const breadcrumb = (): BreadcrumbItemData[] => {
    const response: BreadcrumbItemData[] = [];
    response.push({
      name: t(`entities.rbac`, { count: 2 }),
      href: generateUrl({ page: Modules.RbacMatrix }),
    });
    return response;
  };

  const title = () => {
    const response: {
      type: string;
      functions?: ReactNode;
    } = {
      type: t(`entities.rbac`, { count: 2 }),
    };

    const functions: ReactNode[] = [];
    functions.push(
      <Button
        key="rbacSave"
        size="sm"
        onClick={handleSave}
        disabled={!canSave}
        className="gap-1"
      >
        {saving ? (
          <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <DownloadIcon className="h-3.5 w-3.5" />
        )}
        Save to permissions.ts
      </Button>,
    );
    if (functions.length > 0) response.functions = functions;

    return response;
  };

  // Memoize the context value so stable-identity child consumers don't
  // re-render when only title/breadcrumbs change.
  const contextValue = useMemo<RbacContextType>(
    () => ({
      matrix,
      modulePaths,
      loading,
      error,
      saving,
      roleNames,
      moduleNames,
      updateCell,
      clearCell,
    }),
    [matrix, modulePaths, loading, error, saving, roleNames, moduleNames, updateCell, clearCell],
  );

  return (
    <SharedProvider value={{ breadcrumbs: breadcrumb(), title: title() }}>
      <RbacContext.Provider value={contextValue}>{children}</RbacContext.Provider>
    </SharedProvider>
  );
};

export const useRbacContext = (): RbacContextType => {
  const ctx = useContext(RbacContext);
  if (!ctx) {
    throw new Error("useRbacContext must be used within an RbacProvider");
  }
  return ctx;
};
