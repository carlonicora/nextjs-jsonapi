import { ApiDataInterface } from "../../../core";

/**
 * A user's account-deletion status and what the deletion removes. Not a stored
 * entity: the API builds it for one user; its id is that user's id.
 */
export interface AccountDeletionInterface extends ApiDataInterface {
  get requestedAt(): Date | undefined;
  get scheduledAt(): Date | undefined;
  get hasDeliverableEmail(): boolean;
  get hasActiveSubscription(): boolean;
  get deletesCompany(): boolean;
  get ownedCount(): number;
  get otherTables(): string[];
}

export type AccountDeletionInput = {
  /** The id of the user whose account is deleted. */
  id: string;
  /** The user's email, or DELETE / ELIMINA when the user has no deliverable email. */
  confirmation: string;
};
