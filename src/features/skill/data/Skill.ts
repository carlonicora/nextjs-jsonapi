import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { SkillInput, SkillInterface, SkillOrigin } from "./SkillInterface";

export class Skill extends AbstractApiData implements SkillInterface {
  private _name?: string;
  private _description?: string;
  private _instructions?: string;
  private _isActive?: boolean;
  private _isGlobal?: boolean;
  private _origin?: SkillOrigin;
  private _isEnabled?: boolean;
  private _isHidden?: boolean;
  private _canRestore?: boolean;

  get name(): string {
    return this._name ?? "";
  }

  get description(): string {
    return this._description ?? "";
  }

  get instructions(): string {
    return this._instructions ?? "";
  }

  get isActive(): boolean {
    return this._isActive ?? false;
  }

  get isGlobal(): boolean {
    return this._isGlobal ?? false;
  }

  get origin(): SkillOrigin {
    return this._origin ?? "company";
  }

  get isEnabled(): boolean {
    return this._isEnabled ?? false;
  }

  get isHidden(): boolean {
    return this._isHidden ?? false;
  }

  get canRestore(): boolean {
    return this._canRestore ?? false;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attributes = data.jsonApi.attributes ?? {};
    this._name = attributes.name;
    this._description = attributes.description;
    this._instructions = attributes.instructions;
    this._isActive = attributes.isActive;
    // Read-only values the server computes for the caller; never sent back.
    this._isGlobal = attributes.isGlobal;
    this._origin = attributes.origin;
    this._isEnabled = attributes.isEnabled;
    this._isHidden = attributes.isHidden;
    this._canRestore = attributes.canRestore;

    return this;
  }

  createJsonApi(data: SkillInput): any {
    const response: any = {
      data: {
        type: Modules.Skill.name,
        id: data.id,
        attributes: {},
        relationships: {},
      },
      included: [],
    };

    if (data.name !== undefined) response.data.attributes.name = data.name;
    if (data.description !== undefined) response.data.attributes.description = data.description;
    if (data.instructions !== undefined) response.data.attributes.instructions = data.instructions;
    if (data.isActive !== undefined) response.data.attributes.isActive = data.isActive;

    // Create only: makes this skill a copy of a global skill.
    if (data.originalId) {
      response.data.relationships.original = {
        data: { type: Modules.Skill.name, id: data.originalId },
      };
    }

    return response;
  }
}
