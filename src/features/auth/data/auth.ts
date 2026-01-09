import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { UserInterface } from "../../user/data/user.interface";
import { AuthInput, AuthInterface } from "./auth.interface";

export class Auth extends AbstractApiData implements AuthInterface {
  private _token?: string;
  private _refreshToken?: string;
  private _user?: UserInterface;

  get token(): string {
    if (!this._token) throw new Error("Token is not defined");
    return this._token;
  }

  get refreshToken(): string {
    if (!this._refreshToken) throw new Error("Refresh token is not defined");
    return this._refreshToken;
  }

  get user(): UserInterface {
    if (!this._user) throw new Error("User is not defined");
    return this._user;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._token = data.jsonApi.attributes.token ?? undefined;
    this._refreshToken = data.jsonApi.attributes.refreshToken ?? undefined;

    this._user = this._readIncluded(data, "user", Modules.User) as UserInterface;

    return this;
  }

  createJsonApi(data: AuthInput) {
    const response: any = {
      data: {
        type: Modules.Auth.name,
        attributes: {},
      },
    };

    if (data.id) response.data.id = data.id;
    if (data.email !== undefined) response.data.attributes.email = data.email;
    if (data.name !== undefined) response.data.attributes.name = data.name;
    if (data.companyName !== undefined) response.data.attributes.companyName = data.companyName;
    if (data.password !== undefined) response.data.attributes.password = data.password;

    return response;
  }
}
