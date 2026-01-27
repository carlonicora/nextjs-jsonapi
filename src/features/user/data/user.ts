import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { CompanyInterface } from "../../company/data/company.interface";
import { ModuleInterface } from "../../module";
import { RoleInterface } from "../../role";
import { SearchResultInterface } from "../../search";
import { UserInput, UserInterface } from "./user.interface";

export class User extends AbstractApiData implements UserInterface, SearchResultInterface {
  private _name?: string;
  private _email?: string;
  private _title?: string;
  private _bio?: string;
  private _avatar?: string;
  private _avatarUrl?: string;
  private _phone?: string;
  private _rate?: number;

  private _isActivated?: boolean;
  private _isDeleted?: boolean;
  private _twoFactorEnabled: boolean = false;
  private _lastLogin?: Date;

  private _relevance?: number;

  private _roles: RoleInterface[] = [];
  private _company?: CompanyInterface;
  private _modules: ModuleInterface[] = [];

  get searchResult(): string {
    return this._name ?? "";
  }

  get name(): string {
    return this._name ?? "";
  }

  get email(): string {
    return this._email ?? "";
  }

  get title(): string {
    return this._title ?? "";
  }

  get bio(): string {
    return this._bio ?? "";
  }

  get avatar(): string | undefined {
    return this._avatar;
  }

  get avatarUrl(): string | undefined {
    return this._avatarUrl;
  }

  get phone(): string | undefined {
    return this._phone;
  }

  get rate(): number | undefined {
    return this._rate;
  }

  get relevance(): number | undefined {
    return this._relevance;
  }

  get isActivated(): boolean {
    return this._isActivated ?? false;
  }

  get isDeleted(): boolean {
    return this._isDeleted ?? false;
  }

  get twoFactorEnabled(): boolean {
    return this._twoFactorEnabled;
  }

  get lastLogin(): Date | undefined {
    return this._lastLogin;
  }

  get roles(): RoleInterface[] {
    return this._roles;
  }

  get company(): CompanyInterface | undefined {
    return this._company;
  }

  get modules(): ModuleInterface[] {
    return this._modules;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._name = data.jsonApi.attributes.name;
    this._email = data.jsonApi.attributes.email;
    this._title = data.jsonApi.attributes.title;
    this._bio = data.jsonApi.attributes.bio;
    this._phone = data.jsonApi.attributes.phone;
    this._rate = data.jsonApi.attributes.rate;

    this._avatar = data.jsonApi.attributes.avatar;
    this._avatarUrl = data.jsonApi.attributes.avatarUrl;

    this._isActivated = data.jsonApi.meta.isActive;
    this._isDeleted = data.jsonApi.meta.isDeleted;
    this._twoFactorEnabled = data.jsonApi.attributes.twoFactorEnabled ?? false;
    this._lastLogin = data.jsonApi.meta.lastLogin ? new Date(data.jsonApi.meta.lastLogin) : undefined;

    this._relevance = data.jsonApi.meta.relevance;

    this._roles = this._readIncluded(data, "roles", Modules.Role) as RoleInterface[];
    this._company = this._readIncluded(data, "company", Modules.Company) as CompanyInterface;
    this._modules = this._readIncluded(data, "modules", Modules.Module) as ModuleInterface[];

    return this;
  }

  createJsonApi(data: UserInput) {
    const response: any = {
      data: {
        type: Modules.User.name,
        id: data.id,
        attributes: {
          name: data.name,
        },
        meta: {},
        relationships: {},
      },
      included: [],
    };

    if (data.email !== undefined) response.data.attributes.email = data.email;
    if (data.title !== undefined) response.data.attributes.title = data.title;
    if (data.bio !== undefined) response.data.attributes.bio = data.bio;
    if (data.phone !== undefined) response.data.attributes.phone = data.phone;
    if (data.password !== undefined) response.data.attributes.password = data.password;
    if (data.sendInvitationEmail) response.data.attributes.sendInvitationEmail = true;
    if (data.adminCreated) response.data.attributes.adminCreated = true;
    if (data.avatar) response.data.attributes.avatar = data.avatar;
    if (data.rate !== undefined) response.data.attributes.rate = data.rate;

    if (data.roleIds) {
      response.data.relationships.roles = {
        data: data.roleIds.map((roleId) => ({
          type: Modules.Role.name,
          id: roleId,
        })),
      };
    }

    if (data.companyId) {
      response.data.relationships.company = {
        data: {
          type: Modules.Company.name,
          id: data.companyId,
        },
      };
    }

    return response;
  }
}
