import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { AiConnectionInput, AiConnectionInterface } from "./ai-connection.interface";

export class AiConnection extends AbstractApiData implements AiConnectionInterface {
  private _name?: string;
  private _connectionType?: string;
  private _provider?: string;
  private _position?: number;
  private _enabled?: boolean;
  private _model?: string;
  private _url?: string;
  private _region?: string;
  private _instance?: string;
  private _apiVersion?: string;
  private _allowFallbacks?: boolean;
  private _reasoningEffort?: string;
  private _maxOutputTokens?: number;
  private _dimensions?: number;
  private _inputCostPer1MTokens?: number;
  private _outputCostPer1MTokens?: number;
  private _cachedInputCostPer1MTokens?: number;
  private _costPerMinute?: number;
  private _costPerPage?: number;
  private _directUrl?: string;
  private _language?: string;
  private _directFormat?: string;
  private _directProvider?: string;
  private _hasApiKey?: boolean;
  private _hasGoogleCredentials?: boolean;
  private _companyId?: string;

  get name(): string {
    return this._name ?? "";
  }

  get connectionType(): string {
    return this._connectionType ?? "";
  }

  get provider(): string {
    return this._provider ?? "";
  }

  get position(): number {
    return this._position ?? 0;
  }

  get enabled(): boolean {
    return this._enabled ?? true;
  }

  get model(): string | undefined {
    return this._model;
  }

  get url(): string | undefined {
    return this._url;
  }

  get region(): string | undefined {
    return this._region;
  }

  get instance(): string | undefined {
    return this._instance;
  }

  get apiVersion(): string | undefined {
    return this._apiVersion;
  }

  get allowFallbacks(): boolean | undefined {
    return this._allowFallbacks;
  }

  get reasoningEffort(): string | undefined {
    return this._reasoningEffort;
  }

  get maxOutputTokens(): number | undefined {
    return this._maxOutputTokens;
  }

  get dimensions(): number | undefined {
    return this._dimensions;
  }

  get inputCostPer1MTokens(): number | undefined {
    return this._inputCostPer1MTokens;
  }

  get outputCostPer1MTokens(): number | undefined {
    return this._outputCostPer1MTokens;
  }

  get cachedInputCostPer1MTokens(): number | undefined {
    return this._cachedInputCostPer1MTokens;
  }

  get costPerMinute(): number | undefined {
    return this._costPerMinute;
  }

  get costPerPage(): number | undefined {
    return this._costPerPage;
  }

  get directUrl(): string | undefined {
    return this._directUrl;
  }

  get language(): string | undefined {
    return this._language;
  }

  get directFormat(): string | undefined {
    return this._directFormat;
  }

  get directProvider(): string | undefined {
    return this._directProvider;
  }

  get hasApiKey(): boolean {
    return this._hasApiKey ?? false;
  }

  get hasGoogleCredentials(): boolean {
    return this._hasGoogleCredentials ?? false;
  }

  get companyId(): string | undefined {
    return this._companyId;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attributes = data.jsonApi.attributes ?? {};

    this._name = attributes.name;
    this._connectionType = attributes.connectionType;
    this._provider = attributes.provider;
    this._position = attributes.position;
    this._enabled = attributes.enabled;
    this._model = attributes.model;
    this._url = attributes.url;
    this._region = attributes.region;
    this._instance = attributes.instance;
    this._apiVersion = attributes.apiVersion;
    this._allowFallbacks = attributes.allowFallbacks;
    this._reasoningEffort = attributes.reasoningEffort;
    this._maxOutputTokens = attributes.maxOutputTokens;
    this._dimensions = attributes.dimensions;
    this._inputCostPer1MTokens = attributes.inputCostPer1MTokens;
    this._outputCostPer1MTokens = attributes.outputCostPer1MTokens;
    this._cachedInputCostPer1MTokens = attributes.cachedInputCostPer1MTokens;
    this._costPerMinute = attributes.costPerMinute;
    this._costPerPage = attributes.costPerPage;
    this._directUrl = attributes.directUrl;
    this._language = attributes.language;
    this._directFormat = attributes.directFormat;
    this._directProvider = attributes.directProvider;
    this._hasApiKey = attributes.hasApiKey;
    this._hasGoogleCredentials = attributes.hasGoogleCredentials;
    this._companyId = attributes.companyId;

    return this;
  }

  createJsonApi(data: AiConnectionInput): any {
    const response: any = {
      data: {
        type: Modules.AiConnection.name,
        id: data.id,
        attributes: {},
        relationships: {},
      },
      included: [],
    };

    const setIfDefined = (key: keyof AiConnectionInput) => {
      if (data[key] !== undefined) response.data.attributes[key] = data[key];
    };

    (
      [
        "name",
        "connectionType",
        "provider",
        "position",
        "enabled",
        "model",
        "url",
        "region",
        "instance",
        "apiVersion",
        "allowFallbacks",
        "reasoningEffort",
        "maxOutputTokens",
        "dimensions",
        "inputCostPer1MTokens",
        "outputCostPer1MTokens",
        "cachedInputCostPer1MTokens",
        "costPerMinute",
        "costPerPage",
        "directUrl",
        "language",
        "directFormat",
        "directProvider",
      ] as const
    ).forEach(setIfDefined);

    // Secrets: an empty string means "keep the stored value" — omit it from the
    // payload entirely so the backend never overwrites what it already holds.
    if (data.apiKey) response.data.attributes.apiKey = data.apiKey;
    if (data.googleCredentialsBase64) {
      response.data.attributes.googleCredentialsBase64 = data.googleCredentialsBase64;
    }

    // Scope is chosen at creation and immutable thereafter.
    if (data.companyId) {
      response.data.relationships.company = {
        data: { type: Modules.Company.name, id: data.companyId },
      };
    }

    return response;
  }

  /**
   * Body for POST /ai-connections/reorder. A dedicated model method so the
   * service never constructs a JSON:API payload itself — the sanctioned pairing
   * for `overridesJsonApiCreation`.
   */
  createReorderJsonApi(params: { ids: string[] }): any {
    return {
      data: {
        type: Modules.AiConnection.name,
        ids: params.ids,
      },
    };
  }
}
