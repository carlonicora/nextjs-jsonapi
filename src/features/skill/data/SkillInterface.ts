import { ApiDataInterface } from "../../../core";

/** Where a skill in the caller's list comes from, computed by the server per caller. */
export type SkillOrigin = "global" | "copy" | "company";

export type SkillInput = {
  id: string;
  name?: string;
  description?: string;
  instructions?: string;
  isActive?: boolean;
  /** Create only: the global skill this new skill is a copy of. */
  originalId?: string;
};

export interface SkillInterface extends ApiDataInterface {
  get name(): string;
  get description(): string;
  /** Empty when the server did not send it (`skills/active`). */
  get instructions(): string;
  get isActive(): boolean;
  get isGlobal(): boolean;
  get origin(): SkillOrigin;
  get isEnabled(): boolean;
  get isHidden(): boolean;
  get canRestore(): boolean;
}
