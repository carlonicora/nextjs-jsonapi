/**
 * The fixed namespace of i18n keys the AI connection administration surfaces
 * read via useTranslations. Consuming apps must define each entry in their
 * messages/<locale>.json — this list is the contract between the package and
 * the app, and the names are frozen: an app that wants different wording
 * changes its own translation, never the key.
 *
 * Mirrors the contract shipped by the administration feature
 * (features/administration/i18n-keys.ts) and the billing admin surfaces
 * (features/billing/i18n-keys.ts).
 */
export const AI_CONNECTIONS_I18N_KEYS = [
  "ai_connections.admin.title",
  "ai_connections.admin.entity",
  "ai_connections.admin.create",
  "ai_connections.admin.scope.global",
  "ai_connections.admin.scope.company",
  "ai_connections.admin.scope.inherits_global",
  "ai_connections.admin.env_fallback",
  "ai_connections.admin.empty.title",
  "ai_connections.admin.empty.description",
  "ai_connections.admin.types.ai",
  "ai_connections.admin.types.aiLite",
  "ai_connections.admin.types.aiLarge",
  "ai_connections.admin.types.vision",
  "ai_connections.admin.types.audio",
  "ai_connections.admin.types.embedder",
  "ai_connections.admin.types.transcriber",
  "ai_connections.admin.types.documentAi",
  "ai_connections.admin.fields.name",
  "ai_connections.admin.fields.provider",
  "ai_connections.admin.fields.model",
  "ai_connections.admin.fields.url",
  "ai_connections.admin.fields.apiKey",
  "ai_connections.admin.fields.region",
  "ai_connections.admin.fields.instance",
  "ai_connections.admin.fields.apiVersion",
  "ai_connections.admin.fields.googleCredentialsBase64",
  "ai_connections.admin.fields.allowFallbacks",
  "ai_connections.admin.fields.reasoningEffort",
  "ai_connections.admin.fields.maxOutputTokens",
  "ai_connections.admin.fields.dimensions",
  "ai_connections.admin.fields.inputCostPer1MTokens",
  "ai_connections.admin.fields.outputCostPer1MTokens",
  "ai_connections.admin.fields.cachedInputCostPer1MTokens",
  "ai_connections.admin.fields.costPerMinute",
  "ai_connections.admin.fields.costPerPage",
  "ai_connections.admin.fields.directUrl",
  "ai_connections.admin.fields.language",
  "ai_connections.admin.fields.directFormat",
  "ai_connections.admin.fields.directProvider",
  "ai_connections.admin.fields.enabled",
  "ai_connections.admin.fields.costs_section",
  "ai_connections.admin.placeholders.name",
  "ai_connections.admin.placeholders.secret_unchanged",
  "ai_connections.admin.reorder.up",
  "ai_connections.admin.reorder.down",
  "ai_connections.admin.errors.name",
  "ai_connections.admin.errors.required_field",
  "ai_connections.admin.embedder_warning.title",
  "ai_connections.admin.embedder_warning.description",
  "ai_connections.admin.delete.title",
  "ai_connections.admin.delete.description",
  "ai_connections.admin.delete.confirm",
  "administration.ai_connections.description",
] as const;
