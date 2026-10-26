import { AbstractService, EndpointCreator, HttpMethod, Modules } from "../../../core";
import { AccountDeletion } from "./account-deletion";
import { AccountDeletionInput, AccountDeletionInterface } from "./account-deletion.interface";

export class AccountDeletionService extends AbstractService {
  /**
   * GET the signed-in user's deletion status and what a deletion would remove.
   */
  static async findMine(): Promise<AccountDeletionInterface> {
    return this.callApi<AccountDeletionInterface>({
      type: Modules.AccountDeletion,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({ endpoint: Modules.AccountDeletion, id: "me" }).generate(),
    });
  }

  /**
   * GET another user's deletion status (platform administrators only).
   */
  static async findByUser(params: { userId: string }): Promise<AccountDeletionInterface> {
    return this.callApi<AccountDeletionInterface>({
      type: Modules.AccountDeletion,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({ endpoint: Modules.AccountDeletion, id: params.userId }).generate(),
    });
  }

  /**
   * POST the signed-in user's own deletion request. `params.id` must be the
   * signed-in user's id.
   */
  static async request(params: AccountDeletionInput): Promise<AccountDeletionInterface> {
    return this.callApi<AccountDeletionInterface>({
      type: Modules.AccountDeletion,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: Modules.AccountDeletion }).generate(),
      input: params,
    });
  }

  /**
   * POST a deletion request on behalf of another user (platform administrators
   * only). Runs the same 7-day request as the user's own.
   */
  static async requestForUser(params: AccountDeletionInput): Promise<AccountDeletionInterface> {
    return this.callApi<AccountDeletionInterface>({
      type: Modules.AccountDeletion,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: Modules.AccountDeletion, id: params.id }).generate(),
      input: params,
    });
  }

  /**
   * POST the token from the "Keep my account" email link. Public: no session.
   * Throws on any failure, so the page can show the "link no longer works" text.
   */
  static async keep(params: { token: string }): Promise<void> {
    const accountDeletion = new AccountDeletion();
    await this.callApi<void>({
      type: Modules.AccountDeletion,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: Modules.AccountDeletion, id: "keep" }).generate(),
      input: accountDeletion.createKeepJsonApi({ token: params.token }),
      overridesJsonApiCreation: true, // OK - model method provides proper structure
      suppressGlobalError: true,
    });
  }
}
