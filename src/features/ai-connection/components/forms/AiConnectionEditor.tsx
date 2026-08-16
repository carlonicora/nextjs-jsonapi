"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ReactNode, useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { v4 } from "uuid";
import { z } from "zod";
import { EditorSheet, FormCheckbox, FormInput, FormPassword, FormSelect, MicroLabel } from "../../../../components";
import { Modules } from "../../../../core";
import { Alert, AlertDescription, AlertTitle } from "../../../../shadcnui";
import { AiConnectionInput, AiConnectionInterface, AiConnectionService, AiProviderFieldDescriptor } from "../../data";
import { useAiConnections } from "../../contexts/AiConnectionsContext";

/** Fields grouped under the collapsed-by-convention cost block (spec § 4). */
const COST_FIELDS = [
  "inputCostPer1MTokens",
  "outputCostPer1MTokens",
  "cachedInputCostPer1MTokens",
  "costPerMinute",
  "costPerPage",
];

type AiConnectionFormValues = {
  id: string;
  name: string;
  provider: string;
  enabled: boolean;
  /** Every provider-specific field, keyed by the registry's field id. */
  values: Record<string, any>;
};

export type AiConnectionEditorProps = {
  /** Omitted in create mode. */
  connection?: AiConnectionInterface;
  /** Fixed by the card that owns the editor — never editable. */
  connectionType: string;
  /** Slot in the chain. Fixed: reordering is the up/down arrows' job. */
  position: number;
  /** Scope, set on creation only — immutable thereafter (spec § Decisions). */
  companyId?: string;
  trigger?: ReactNode;
  forceShow?: boolean;
  onClose?: () => void;
};

/**
 * Schema-driven editor for one link in a fallback chain.
 *
 * The static half of the form (name / provider / enabled) is a fixed zod shape;
 * everything else is rendered blind from `meta.providerRegistry`, so a new
 * provider field on the backend needs no change here — only an i18n string.
 * Required-ness is enforced by a `superRefine` over the same registry, which
 * keeps failures inline on the field instead of an error toast. The backend
 * re-validates authoritatively.
 */
export function AiConnectionEditor({
  connection,
  connectionType,
  position,
  companyId,
  trigger,
  forceShow,
  onClose,
}: AiConnectionEditorProps) {
  const t = useTranslations();
  const { providerRegistry, refresh } = useAiConnections();
  const isEdit = !!connection;

  const registryRows = useMemo(() => providerRegistry[connectionType] ?? [], [providerRegistry, connectionType]);
  const providers = useMemo(() => registryRows.map((row) => row.provider), [registryRows]);

  const fieldsFor = useCallback(
    (provider: string): AiProviderFieldDescriptor[] =>
      registryRows.find((row) => row.provider === provider)?.fields ?? [],
    [registryRows],
  );

  /** Seeds the `values` map for a provider: stored value → registry default → empty. */
  const defaultsFor = useCallback(
    (provider: string): Record<string, any> => {
      const stored = connection as unknown as Record<string, unknown> | undefined;
      const seeded: Record<string, any> = {};

      fieldsFor(provider).forEach((descriptor) => {
        if (descriptor.kind === "boolean") {
          const current = stored?.[descriptor.field];
          seeded[descriptor.field] =
            current !== undefined && current !== null ? current === true : descriptor.default === true;
          return;
        }

        // Secrets are write-only: the API answers with a has-flag, never a value.
        if (descriptor.kind === "secret") {
          seeded[descriptor.field] = "";
          return;
        }

        const current = stored?.[descriptor.field];
        if (current !== undefined && current !== null) seeded[descriptor.field] = String(current);
        else seeded[descriptor.field] = descriptor.default !== undefined ? String(descriptor.default) : "";
      });

      return seeded;
    },
    [connection, fieldsFor],
  );

  const hasStoredSecret = useCallback(
    (field: string) => {
      if (!connection) return false;
      if (field === "apiKey") return connection.hasApiKey;
      if (field === "googleCredentialsBase64") return connection.hasGoogleCredentials;
      return false;
    },
    [connection],
  );

  const formSchema = useMemo(
    () =>
      z
        .object({
          id: z.uuidv4(),
          name: z.string().min(1, { message: t("ai_connections.admin.errors.name") }),
          provider: z.string().min(1, { message: t("ai_connections.admin.errors.required_field") }),
          enabled: z.boolean(),
          values: z.record(z.string(), z.any()),
        })
        .superRefine((data, ctx) => {
          fieldsFor(data.provider)
            .filter((descriptor) => descriptor.required)
            .forEach((descriptor) => {
              const value = data.values?.[descriptor.field];
              // A stored secret counts as filled: blank means "keep it".
              const filled =
                descriptor.kind === "secret"
                  ? !!value || hasStoredSecret(descriptor.field)
                  : descriptor.kind === "boolean"
                    ? value !== undefined
                    : value !== undefined && value !== null && String(value).trim() !== "";
              if (filled) return;
              ctx.addIssue({
                code: "custom",
                message: t("ai_connections.admin.errors.required_field"),
                path: ["values", descriptor.field],
              });
            });
        }),
    [t, fieldsFor, hasStoredSecret],
  );

  const getDefaultValues = useCallback(
    (): AiConnectionFormValues => ({
      id: connection?.id ?? v4(),
      name: connection?.name ?? "",
      provider: connection?.provider ?? providers[0] ?? "",
      enabled: connection?.enabled ?? true,
      values: defaultsFor(connection?.provider ?? providers[0] ?? ""),
    }),
    [connection, providers, defaultsFor],
  );

  const form = useForm<AiConnectionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  // The registry arrives with the list request, which can resolve after this
  // component mounts — so the provider and its field map are seeded again once
  // it is available. Pre-filling via setValue is the supported create-mode
  // pattern (EditorSheet re-seeds only on edit; see EditorSheet.tsx:163-190).
  useEffect(() => {
    if (registryRows.length === 0) return;

    const currentProvider = form.getValues("provider");
    const provider = currentProvider || connection?.provider || providers[0] || "";
    if (!provider) return;
    if (provider !== currentProvider) form.setValue("provider", provider);

    const currentValues = form.getValues("values");
    if (!currentValues || Object.keys(currentValues).length === 0) form.setValue("values", defaultsFor(provider));
    // Deliberately keyed on the registry alone: re-running on `form` identity
    // would clobber what the user has typed.
  }, [registryRows]);

  const selectedProvider = form.watch("provider");
  const selectedFields = fieldsFor(selectedProvider);
  const configFields = selectedFields.filter((descriptor) => !COST_FIELDS.includes(descriptor.field));
  const costFields = selectedFields.filter((descriptor) => COST_FIELDS.includes(descriptor.field));

  /** Registry value → wire value. Numbers arrive from the input as strings. */
  const coerce = (descriptor: AiProviderFieldDescriptor, raw: any) => {
    if (descriptor.kind === "boolean") return raw === true;
    if (raw === undefined || raw === null || String(raw).trim() === "") return undefined;
    if (descriptor.kind === "number") {
      const parsed = Number(String(raw).replace(",", "."));
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return String(raw);
  };

  const renderField = (descriptor: AiProviderFieldDescriptor) => {
    const id = `values.${descriptor.field}`;
    const label = t(`ai_connections.admin.fields.${descriptor.field}`);

    switch (descriptor.kind) {
      case "secret":
        return (
          <FormPassword
            key={descriptor.field}
            form={form}
            id={id}
            name={label}
            isRequired={descriptor.required}
            placeholder={
              isEdit && hasStoredSecret(descriptor.field)
                ? t("ai_connections.admin.placeholders.secret_unchanged")
                : undefined
            }
          />
        );
      case "boolean":
        return <FormCheckbox key={descriptor.field} form={form} id={id} name={label} />;
      case "select":
        return (
          <FormSelect
            key={descriptor.field}
            form={form}
            id={id}
            name={label}
            isRequired={descriptor.required}
            allowEmpty={!descriptor.required}
            values={(descriptor.options ?? []).map((option) => ({ id: option, text: option }))}
          />
        );
      case "number":
        // "decimal", not "number": FormInput's number mode strips everything but
        // digits, which would make a cost of 0.15 unrepresentable.
        return (
          <FormInput
            key={descriptor.field}
            form={form}
            id={id}
            name={label}
            type="decimal"
            isRequired={descriptor.required}
          />
        );
      default:
        return <FormInput key={descriptor.field} form={form} id={id} name={label} isRequired={descriptor.required} />;
    }
  };

  return (
    <EditorSheet
      form={form}
      entityType={t("ai_connections.admin.entity")}
      entityName={connection?.name}
      isEdit={isEdit}
      module={Modules.AiConnection}
      size="md"
      onSuccess={refresh}
      onSubmit={async (values) => {
        const attributes: Record<string, unknown> = {};
        fieldsFor(values.provider).forEach((descriptor) => {
          const coerced = coerce(descriptor, values.values?.[descriptor.field]);
          if (coerced !== undefined) attributes[descriptor.field] = coerced;
        });

        const payload = {
          id: values.id,
          name: values.name,
          connectionType,
          provider: values.provider,
          position,
          enabled: values.enabled,
          ...attributes,
          // Scope is fixed at creation; sending it on update would be a no-op at
          // best and a scope change at worst, which the design forbids.
          ...(isEdit || !companyId ? {} : { companyId }),
        } as AiConnectionInput;

        if (isEdit) await AiConnectionService.update(payload);
        else await AiConnectionService.create(payload);
      }}
      onReset={getDefaultValues}
      trigger={trigger}
      forceShow={forceShow}
      onClose={onClose}
    >
      <div className="flex w-full flex-col gap-y-4">
        {connectionType === "embedder" && (
          <Alert variant="destructive">
            <AlertTitle>{t("ai_connections.admin.embedder_warning.title")}</AlertTitle>
            <AlertDescription>{t("ai_connections.admin.embedder_warning.description")}</AlertDescription>
          </Alert>
        )}

        <FormInput
          form={form}
          id="name"
          name={t("ai_connections.admin.fields.name")}
          placeholder={t("ai_connections.admin.placeholders.name")}
          isRequired
        />

        <FormSelect
          form={form}
          id="provider"
          name={t("ai_connections.admin.fields.provider")}
          isRequired
          values={providers.map((provider) => ({ id: provider, text: provider }))}
          onChange={(provider) => form.setValue("values", defaultsFor(provider))}
        />

        <FormCheckbox form={form} id="enabled" name={t("ai_connections.admin.fields.enabled")} />

        {configFields.map(renderField)}

        {costFields.length > 0 && (
          <div className="flex w-full flex-col gap-y-4">
            <MicroLabel>{t("ai_connections.admin.fields.costs_section")}</MicroLabel>
            {costFields.map(renderField)}
          </div>
        )}
      </div>
    </EditorSheet>
  );
}
