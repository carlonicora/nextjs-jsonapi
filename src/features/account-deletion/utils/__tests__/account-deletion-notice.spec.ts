import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { consumeAccountDeletionCancelled, markAccountDeletionCancelled } from "../account-deletion-notice";

describe("account-deletion notice flag", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
  });

  it("consume returns true once after mark, then false", () => {
    expect(consumeAccountDeletionCancelled()).toBe(false);

    markAccountDeletionCancelled();

    expect(consumeAccountDeletionCancelled()).toBe(true);
    expect(consumeAccountDeletionCancelled()).toBe(false);
  });

  it("survives a throwing sessionStorage", () => {
    const throwing = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    vi.stubGlobal("sessionStorage", throwing);

    expect(() => markAccountDeletionCancelled()).not.toThrow();
    expect(consumeAccountDeletionCancelled()).toBe(false);
  });
});
