"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { RoundPageContainer } from "../../../../components";
import { Modules } from "../../../../core";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../shadcnui";
import { CompanyInterface } from "../../../company/data/company.interface";
import { CompanyService } from "../../../company/data/company.service";
import { AiConnectionsProvider, useAiConnections } from "../../contexts/AiConnectionsContext";
import { AiConnectionTypeCard } from "../lists/AiConnectionTypeCard";

/**
 * The eight definable connection types, in the order the page presents them.
 * Mirrors AI_CONNECTION_TYPES on the backend (core/llm/interfaces/ai-candidate.interface.ts);
 * the frontend renders them blind — every label is an i18n key.
 */
export const AI_CONNECTION_TYPE_ORDER = [
  "ai",
  "aiLite",
  "aiLarge",
  "vision",
  "audio",
  "embedder",
  "transcriber",
  "documentAi",
] as const;

/** Sentinel for the global chain — Base UI Select cannot hold `null`. */
const GLOBAL_SCOPE = "global";

/**
 * Page container for the AI-connections administration surface.
 *
 * Client component by necessity: `module={Modules.AiConnection}` is a registry
 * entry carrying an icon component and methods, which a Server Component cannot
 * pass across the boundary. Routes mount this container bare — it brings its own
 * provider (which publishes the page chrome) and its own shell, the same shape
 * as ProductsListContainer.
 */
export function AiConnectionsContainer() {
  return (
    <AiConnectionsProvider>
      <RoundPageContainer module={Modules.AiConnection} fullWidth forceHeader>
        <AiConnectionsBody />
      </RoundPageContainer>
    </AiConnectionsProvider>
  );
}

function AiConnectionsBody() {
  const t = useTranslations();
  const { scopeCompanyId, setScopeCompanyId } = useAiConnections();
  const [companies, setCompanies] = useState<CompanyInterface[]>([]);

  useEffect(() => {
    let active = true;
    CompanyService.findMany({})
      .then((response) => {
        if (active) setCompanies(response ?? []);
      })
      .catch(() => {
        // A company list that cannot be read only costs the per-company scope;
        // the global chains — the page's primary content — still render.
        if (active) setCompanies([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const scopeItems = useMemo<Record<string, string>>(
    () => ({
      [GLOBAL_SCOPE]: t("ai_connections.admin.scope.global"),
      ...Object.fromEntries(companies.map((company) => [company.id, company.name])),
    }),
    [companies, t],
  );

  return (
    <div className="flex w-full flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          items={scopeItems}
          value={scopeCompanyId ?? GLOBAL_SCOPE}
          onValueChange={(value) => setScopeCompanyId(!value || value === GLOBAL_SCOPE ? null : String(value))}
        >
          <SelectTrigger size="sm" className="w-64" aria-label={t("ai_connections.admin.scope.company")}>
            <SelectValue placeholder={t("ai_connections.admin.scope.global")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={GLOBAL_SCOPE}>{t("ai_connections.admin.scope.global")}</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex w-full flex-col gap-4">
        {AI_CONNECTION_TYPE_ORDER.map((connectionType) => (
          <AiConnectionTypeCard key={connectionType} connectionType={connectionType} />
        ))}
      </div>
    </div>
  );
}
