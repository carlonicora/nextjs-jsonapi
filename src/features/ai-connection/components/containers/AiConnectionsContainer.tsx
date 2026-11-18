"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { RoundPageContainer } from "../../../../components";
import { Modules } from "../../../../core";
import EntitySelector from "../../../../components/forms/EntitySelector";
import { CompanyInterface } from "../../../company/data/company.interface";
import { CompanyService } from "../../../company/data/company.service";
import { AiConnectionsProvider, useAiConnections } from "../../contexts/AiConnectionsContext";
import { AiConnectionTypeCard } from "../lists/AiConnectionTypeCard";

/**
 * The nine definable connection types, in the order the page presents them.
 * Mirrors AI_CONNECTION_TYPES on the backend (core/llm/interfaces/ai-candidate.interface.ts);
 * the frontend renders them blind — every label is an i18n key.
 */
export const AI_CONNECTION_TYPE_ORDER = [
  "ai",
  "aiLite",
  "aiLarge",
  "vision",
  "audio",
  "image",
  "embedder",
  "transcriber",
  "documentAi",
] as const;

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
  const form = useForm<{ company?: { id: string; name: string } }>({ defaultValues: { company: undefined } });

  useEffect(() => {
    if (!scopeCompanyId) {
      form.setValue("company", undefined);
      return;
    }
    if (form.getValues("company")?.id === scopeCompanyId) return;
    let active = true;
    CompanyService.findOne({ companyId: scopeCompanyId })
      .then((found) => {
        if (active) form.setValue("company", { id: found.id, name: found.name });
      })
      .catch(() => {
        // An id that is not a company falls back to the global chain.
        if (active) setScopeCompanyId(null);
      });
    return () => {
      active = false;
    };
  }, [scopeCompanyId]);

  return (
    <div className="flex w-full flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="w-64"
          role="group"
          aria-label={t("ai_connections.admin.scope.company")}
          data-testid="ai-connection-company-picker"
        >
          <EntitySelector<CompanyInterface>
            id="company"
            form={form}
            module={Modules.Company}
            retriever={(params) => CompanyService.findMany({ ...params, sort: "name" })}
            noneLabel={t("ai_connections.admin.scope.global")}
            onChange={(picked) => setScopeCompanyId(picked?.id ?? null)}
          />
        </div>
      </div>

      <div className="flex w-full flex-col gap-4">
        {AI_CONNECTION_TYPE_ORDER.map((connectionType) => (
          <AiConnectionTypeCard key={connectionType} connectionType={connectionType} />
        ))}
      </div>
    </div>
  );
}
