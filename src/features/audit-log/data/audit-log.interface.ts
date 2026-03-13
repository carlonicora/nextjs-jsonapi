import { ApiDataInterface, UserInterface } from "../../../core";

export interface AuditLogInterface extends ApiDataInterface {
  get kind(): "audit" | "comment";
  get action(): string | undefined;
  get fieldName(): string | undefined;
  get oldValue(): string | undefined;
  get newValue(): string | undefined;
  get content(): string | undefined;
  get annotationId(): string | undefined;
  get user(): UserInterface | undefined;
}
