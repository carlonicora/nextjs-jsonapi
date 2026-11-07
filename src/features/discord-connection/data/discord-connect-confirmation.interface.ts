import { ApiDataInterface } from "../../../core";

export type DiscordConnectResult = "connected" | "taken" | "already" | "failed";

/**
 * The outcome of confirming a Connect Discord return. `result` defaults to "failed".
 */
export interface DiscordConnectConfirmationInterface extends ApiDataInterface {
  get result(): DiscordConnectResult;
  get discordName(): string | undefined;
}

export type DiscordConnectConfirmationInput = {
  /** The confirmation token from the `discordConnectConfirm` return parameter. */
  id: string;
};
