import { ApiDataInterface } from "../../../core";
import { UserInterface } from "../../user";

export type NotificationInput = {
  id: string;
  isRead: boolean;
};

export interface NotificationInterface extends ApiDataInterface {
  get notificationType(): string;
  get isRead(): boolean;
  get message(): string | undefined;
  get actionUrl(): string | undefined;

  get actor(): UserInterface | undefined;
}
