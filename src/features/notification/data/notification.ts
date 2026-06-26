import { AbstractApiData, ApiDataInterface, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { NotificationInput, NotificationInterface } from "./notification.interface";

export class Notification extends AbstractApiData implements NotificationInterface {
  private _notificationType?: string;
  private _isRead?: boolean;
  private _message?: string;
  private _actionUrl?: string;

  private _actor?: ApiDataInterface;
  private _subject?: ApiDataInterface;

  get notificationType(): string {
    if (this._notificationType === undefined) throw new Error("notificationType is not set");
    return this._notificationType;
  }

  get isRead(): boolean {
    return this._isRead === undefined ? false : this._isRead;
  }

  get message(): string | undefined {
    return this._message;
  }

  get actionUrl(): string | undefined {
    return this._actionUrl;
  }

  get actor(): ApiDataInterface | undefined {
    return this._actor;
  }

  get subject(): ApiDataInterface | undefined {
    return this._subject;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._notificationType = data.jsonApi.attributes.notificationType;
    this._isRead = data.jsonApi.attributes.isRead;
    this._message = data.jsonApi.attributes.message;
    this._actionUrl = data.jsonApi.attributes.actionUrl;

    const rels = (data.jsonApi.relationships ?? {}) as Record<string, { data?: { type: string; id: string } }>;

    const actorType = rels.actor?.data?.type;
    this._actor = actorType
      ? (this._readIncluded(data, "actor", Modules.findByName(actorType)) as ApiDataInterface)
      : undefined;

    const subjectName = Object.keys(rels).find((name) => name !== "actor" && rels[name]?.data?.type);
    const subjectType = subjectName ? rels[subjectName]?.data?.type : undefined;
    this._subject =
      subjectName && subjectType
        ? (this._readIncluded(data, subjectName, Modules.findByName(subjectType)) as ApiDataInterface)
        : undefined;

    return this;
  }

  createJsonApi(data: NotificationInput) {
    const response: any = {
      data: {
        type: Modules.Notification.name,
        id: data.id,
        attributes: {
          isRead: data.isRead,
        },
        meta: {},
        relationships: {},
      },
      included: [],
    };

    return response;
  }
}
