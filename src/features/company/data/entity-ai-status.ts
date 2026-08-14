// Frontend mirror of the backend `EntityAiStatus` enum (apps/api). Keep the
// exact const-object + type shape and PascalCase values in sync with the
// backend — this is the shared contract for credit-gated AI processing state.
export const EntityAiStatus = {
  Pending: "Pending",
  Summarising: "Summarising",
  Completed: "Completed",
  Failed: "Failed",
  PendingCredits: "PendingCredits",
  Discarded: "Discarded",
} as const;

export type EntityAiStatus = (typeof EntityAiStatus)[keyof typeof EntityAiStatus];
