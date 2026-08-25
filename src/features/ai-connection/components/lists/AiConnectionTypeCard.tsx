"use client";

import { ChevronDownIcon, ChevronUpIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { SectionHeader } from "../../../../components";
import { errorToast } from "../../../../components/errors";
import { Badge, Button, Card, CardAction, CardContent, CardHeader, EmptyState, Switch } from "../../../../shadcnui";
import { cn } from "../../../../utils";
import { AiConnectionInput, AiConnectionInterface, AiConnectionService } from "../../data";
import { useAiConnections } from "../../contexts/AiConnectionsContext";
import { AiConnectionDeleter } from "../forms/AiConnectionDeleter";
import { AiConnectionEditor } from "../forms/AiConnectionEditor";

/**
 * Rebuilds the full write payload for an existing connection.
 *
 * Every mutation goes through the model (AiConnectionService.update →
 * AiConnection.createJsonApi), so an inline toggle has to resend the row's
 * current attributes rather than patch a single one. Secrets are deliberately
 * absent: an omitted secret means "keep the stored value" (spec § Decisions),
 * and the API never serialises them back in the first place.
 */
function toInput(connection: AiConnectionInterface, overrides: Partial<AiConnectionInput>): AiConnectionInput {
  return {
    id: connection.id,
    name: connection.name,
    connectionType: connection.connectionType,
    provider: connection.provider,
    position: connection.position,
    enabled: connection.enabled,
    model: connection.model,
    url: connection.url,
    region: connection.region,
    instance: connection.instance,
    apiVersion: connection.apiVersion,
    allowFallbacks: connection.allowFallbacks,
    reasoningEffort: connection.reasoningEffort,
    maxOutputTokens: connection.maxOutputTokens,
    dimensions: connection.dimensions,
    inputCostPer1MTokens: connection.inputCostPer1MTokens,
    outputCostPer1MTokens: connection.outputCostPer1MTokens,
    cachedInputCostPer1MTokens: connection.cachedInputCostPer1MTokens,
    costPerMinute: connection.costPerMinute,
    costPerPage: connection.costPerPage,
    directUrl: connection.directUrl,
    language: connection.language,
    directFormat: connection.directFormat,
    directProvider: connection.directProvider,
    ...overrides,
  };
}

export type AiConnectionTypeCardProps = {
  /** One of the eight AI connection types — also the card's heading key. */
  connectionType: string;
};

/**
 * One fallback chain, for one connection type, in the currently selected scope.
 *
 * The chain always ends with a read-only ".env fallback" row: the env block is
 * the last candidate the resolver tries, so showing it keeps the page an honest
 * picture of what a call will actually do (spec § 4).
 */
export function AiConnectionTypeCard({ connectionType }: AiConnectionTypeCardProps) {
  const t = useTranslations();
  const { connections, envDefaults, scopeCompanyId, refresh } = useAiConnections();

  const rows = useMemo(
    () =>
      connections
        .filter(
          (connection) =>
            connection.connectionType === connectionType &&
            (scopeCompanyId ? connection.companyId === scopeCompanyId : !connection.companyId),
        )
        .sort((a, b) => a.position - b.position),
    [connections, connectionType, scopeCompanyId],
  );

  // Shown greyed-out under the "inheriting global chain" hint when a company
  // scope has no chain of its own for this type.
  const globalRows = useMemo(
    () =>
      connections
        .filter((connection) => connection.connectionType === connectionType && !connection.companyId)
        .sort((a, b) => a.position - b.position),
    [connections, connectionType],
  );

  const inheritsGlobal = !!scopeCompanyId && rows.length === 0;
  const envDefault = envDefaults[connectionType];
  const typeLabel = t(`ai_connections.admin.types.${connectionType}`);

  const setEnabled = async (connection: AiConnectionInterface, enabled: boolean) => {
    try {
      await AiConnectionService.update(toInput(connection, { enabled }));
      await refresh();
    } catch (error) {
      errorToast({ title: typeLabel, error });
    }
  };

  /** Moves a row by one slot and renumbers the whole chain server-side. */
  const move = async (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const reordered = [...rows];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);
    try {
      await AiConnectionService.reorder({ ids: reordered.map((connection) => connection.id) });
      await refresh();
    } catch (error) {
      errorToast({ title: typeLabel, error });
    }
  };

  const renderRow = (connection: AiConnectionInterface, index: number, readOnly: boolean, total: number) => (
    <div
      key={connection.id}
      className={cn("flex items-center gap-3 px-3 py-2", readOnly && "opacity-50")}
      data-testid={`ai-connection-row-${connection.id}`}
    >
      <span className="text-muted-foreground w-5 text-end text-xs tabular-nums">{index + 1}</span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm">{connection.name}</span>
        <span className="text-muted-foreground truncate text-xs">
          {[connection.provider, connection.model].filter(Boolean).join(" · ")}
        </span>
      </div>
      <Switch
        checked={connection.enabled}
        disabled={readOnly}
        aria-label={t("ai_connections.admin.fields.enabled")}
        onCheckedChange={(checked) => {
          if (!readOnly) void setEnabled(connection, checked === true);
        }}
      />
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground"
        aria-label={t("ai_connections.admin.reorder.up")}
        disabled={readOnly || index === 0}
        onClick={() => void move(index, -1)}
      >
        <ChevronUpIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground"
        aria-label={t("ai_connections.admin.reorder.down")}
        disabled={readOnly || index === total - 1}
        onClick={() => void move(index, 1)}
      >
        <ChevronDownIcon />
      </Button>
      {!readOnly && (
        <>
          <AiConnectionEditor
            connection={connection}
            connectionType={connectionType}
            position={connection.position}
            companyId={connection.companyId}
          />
          <AiConnectionDeleter connection={connection} />
        </>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <SectionHeader>{typeLabel}</SectionHeader>
        <CardAction>
          <AiConnectionEditor
            connectionType={connectionType}
            position={rows.length}
            companyId={scopeCompanyId ?? undefined}
            trigger={
              <Button variant="outline" size="sm">
                <PlusIcon />
                {t("ai_connections.admin.create")}
              </Button>
            }
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        {inheritsGlobal && (
          <p className="text-muted-foreground mb-2 text-xs">{t("ai_connections.admin.scope.inherits_global")}</p>
        )}

        <div className="divide-border flex flex-col divide-y rounded-md border">
          {inheritsGlobal
            ? globalRows.map((connection, index) => renderRow(connection, index, true, globalRows.length))
            : rows.map((connection, index) => renderRow(connection, index, false, rows.length))}

          {!inheritsGlobal && rows.length === 0 && (
            <EmptyState
              className="p-3"
              title={t("ai_connections.admin.empty.title")}
              description={t("ai_connections.admin.empty.description")}
            />
          )}

          {/* The env block is always the last candidate the resolver tries, so
              it always closes the chain — read-only, with no controls. */}
          <div className="bg-muted/40 flex flex-wrap items-center gap-2 px-3 py-2">
            <Badge variant="softGray">{t("ai_connections.admin.env_fallback")}</Badge>
            <span className="text-muted-foreground truncate text-xs">
              {[envDefault?.provider, envDefault?.model, envDefault?.url].filter(Boolean).join(" · ")}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
