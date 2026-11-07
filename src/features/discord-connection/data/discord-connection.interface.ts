import { ApiDataInterface } from "../../../core";

/**
 * Whether the signed-in user has a Discord account attached. Not a stored entity:
 * the API builds it for one user; its id is that user's id.
 */
export interface DiscordConnectionInterface extends ApiDataInterface {
  get connected(): boolean;
  get discordName(): string | undefined;
}
