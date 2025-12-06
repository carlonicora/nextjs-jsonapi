import { FieldSelector } from "../fields/FieldSelector";
import { ApiRequestDataTypeInterface } from "../interfaces/ApiRequestDataTypeInterface";

export type EndpointQuery = {
  endpoint: ApiRequestDataTypeInterface;
  id?: string;
  childEndpoint?: ApiRequestDataTypeInterface | string;
  childId?: string;
  additionalParams?: { key: string; value: string | string[] }[];
};

export class EndpointCreator {
  private _endpoint: EndpointQuery;

  constructor(params: {
    endpoint: ApiRequestDataTypeInterface;
    id?: string;
    childEndpoint?: ApiRequestDataTypeInterface | string;
    childId?: string;
    additionalParams?: { key: string; value: string }[];
  }) {
    this._endpoint = {
      endpoint: params.endpoint,
      id: params.id,
      childEndpoint: params.childEndpoint,
      childId: params.childId,
      additionalParams: params.additionalParams ?? [],
    };
  }

  endpoint(value: ApiRequestDataTypeInterface): EndpointCreator {
    this._endpoint.endpoint = value;
    return this;
  }

  id(value: string): EndpointCreator {
    this._endpoint.id = value;
    return this;
  }

  childEndpoint(value: ApiRequestDataTypeInterface | string): EndpointCreator {
    this._endpoint.childEndpoint = value;
    return this;
  }

  childId(value: string): EndpointCreator {
    this._endpoint.childId = value;
    return this;
  }

  set additionalParams(value: { key: string; value: string }[]) {
    this._endpoint.additionalParams = value;
  }

  addAdditionalParam(key: string, value: string | string[]): EndpointCreator {
    if (!this._endpoint.additionalParams) this._endpoint.additionalParams = [];
    this._endpoint.additionalParams.push({ key, value });
    return this;
  }

  limitToType(selectors: string[]): this {
    this.addAdditionalParam(`include`, selectors.join(","));
    return this;
  }

  limitToFields(selectors: FieldSelector<any>[]): this {
    if (selectors.length === 0) return this;

    selectors.forEach((selector) => {
      const fieldString = selector.fields.join(",");
      this.addAdditionalParam(`fields[${selector.type}]`, fieldString);
    });

    return this;
  }

  generate(): string {
    let additionalParams = "";
    if (this._endpoint.additionalParams) {
      additionalParams = this._endpoint.additionalParams.map((param) => `${param.key}=${param.value}`).join("&");
    }

    let response = `${this._endpoint.endpoint.name}`;
    if (this._endpoint.id) response += `/${this._endpoint.id}`;
    if (this._endpoint.childEndpoint) {
      response += `/${
        typeof this._endpoint.childEndpoint === "string"
          ? this._endpoint.childEndpoint
          : this._endpoint.childEndpoint.name
      }`;
    }
    if (this._endpoint.childId) response += `/${this._endpoint.childId}`;
    if (additionalParams) response += `?${additionalParams}`;

    return response;
  }
}
