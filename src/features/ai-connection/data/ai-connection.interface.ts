import { ApiDataInterface } from "../../../core";

/**
 * One editable field of a provider, as described by the backend provider
 * registry (`AI_PROVIDER_REGISTRY`, served as top-level JSON:API `meta` on the
 * list endpoint). The registry carries structure only — never display text:
 * the editor derives its i18n keys from `field`.
 */
export interface AiProviderFieldDescriptor {
  field: string;
  kind: "text" | "secret" | "number" | "boolean" | "select";
  required?: boolean;
  options?: string[];
  default?: string | number | boolean;
}

/** `meta.providerRegistry`: connection type → the providers allowed for it. */
export type AiProviderRegistry = Record<string, { provider: string; fields: AiProviderFieldDescriptor[] }[]>;

/**
 * `meta.envDefaults`: connection type → the `.env` block that always closes the
 * chain. Secrets are never included.
 */
export type AiConnectionEnvDefaults = Record<string, { provider?: string; model?: string; url?: string }>;

export interface AiConnectionInterface extends ApiDataInterface {
  get name(): string;
  get connectionType(): string;
  get provider(): string;
  get position(): number;
  get enabled(): boolean;
  get model(): string | undefined;
  get url(): string | undefined;
  get region(): string | undefined;
  get instance(): string | undefined;
  get apiVersion(): string | undefined;
  get allowFallbacks(): boolean | undefined;
  get reasoningEffort(): string | undefined;
  get maxOutputTokens(): number | undefined;
  get dimensions(): number | undefined;
  get inputCostPer1MTokens(): number | undefined;
  get outputCostPer1MTokens(): number | undefined;
  get cachedInputCostPer1MTokens(): number | undefined;
  get costPerMinute(): number | undefined;
  get costPerPage(): number | undefined;
  get directUrl(): string | undefined;
  get language(): string | undefined;
  get directFormat(): string | undefined;
  get directProvider(): string | undefined;
  /** Secrets are never serialised — the API returns presence flags instead. */
  get hasApiKey(): boolean;
  get hasGoogleCredentials(): boolean;
  /** Absent = a global connection; set = scoped to that company. */
  get companyId(): string | undefined;
}

export type AiConnectionInput = {
  id: string;
  name: string;
  connectionType: string;
  provider: string;
  position: number;
  enabled: boolean;
  model?: string;
  url?: string;
  /** Secrets: omit or send "" to keep the stored value on update. */
  apiKey?: string;
  googleCredentialsBase64?: string;
  region?: string;
  instance?: string;
  apiVersion?: string;
  allowFallbacks?: boolean;
  reasoningEffort?: string;
  maxOutputTokens?: number;
  dimensions?: number;
  inputCostPer1MTokens?: number;
  outputCostPer1MTokens?: number;
  cachedInputCostPer1MTokens?: number;
  costPerMinute?: number;
  costPerPage?: number;
  directUrl?: string;
  language?: string;
  directFormat?: string;
  directProvider?: string;
  /** Set on creation only — scope is immutable thereafter. */
  companyId?: string;
};
