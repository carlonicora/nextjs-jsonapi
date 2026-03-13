import { AbstractApiData, JsonApiHydratedDataInterface, Modules, UserInterface } from "../../../core";
import { AuditLogInterface } from "./audit-log.interface";

export class AuditLog extends AbstractApiData implements AuditLogInterface {
  private _kind: "audit" | "comment" = "audit";
  private _action?: string;
  private _fieldName?: string;
  private _oldValue?: string;
  private _newValue?: string;
  private _content?: string;
  private _annotationId?: string;
  private _user?: UserInterface;

  get kind(): "audit" | "comment" {
    return this._kind;
  }

  get action(): string | undefined {
    return this._action;
  }

  get fieldName(): string | undefined {
    return this._fieldName;
  }

  get oldValue(): string | undefined {
    return this._oldValue;
  }

  get newValue(): string | undefined {
    return this._newValue;
  }

  get content(): string | undefined {
    return this._content;
  }

  get annotationId(): string | undefined {
    return this._annotationId;
  }

  get user(): UserInterface | undefined {
    return this._user;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._kind = data.jsonApi.attributes.kind ?? "audit";
    this._action = data.jsonApi.attributes.action ?? undefined;
    this._fieldName = data.jsonApi.attributes.fieldName ?? undefined;
    this._oldValue = data.jsonApi.attributes.oldValue ?? undefined;
    this._newValue = data.jsonApi.attributes.newValue ?? undefined;
    this._content = data.jsonApi.attributes.content ?? undefined;
    this._annotationId = data.jsonApi.attributes.annotationId ?? undefined;

    this._user = this._readIncluded(data, "user", Modules.User) as UserInterface | undefined;

    return this;
  }

  createJsonApi(): any {
    throw new Error("AuditLog is read-only");
  }
}
