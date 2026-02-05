import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { Logout } from "../Logout";

// Mock the dependencies
vi.mock("../../../../../hooks", () => ({
  usePageUrlGenerator:
    () =>
    ({ page }: { page: string }) =>
      page,
}));

vi.mock("../../../data/auth.service", () => ({
  AuthService: {
    logout: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../../../utils/clearClientStorage", () => ({
  clearClientStorage: vi.fn(),
}));

// Import mocked modules for assertions
import { AuthService } from "../../../data/auth.service";
import { clearClientStorage } from "../../../utils/clearClientStorage";

describe("Logout", () => {
  let windowLocationHref: string;
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    windowLocationHref = "";

    // Mock window.location.href using Object.defineProperty on window.location
    // We need to delete the original location first
    // @ts-expect-error - deleting window.location for mocking purposes
    delete window.location;
    window.location = {
      ...originalLocation,
      get href() {
        return windowLocationHref;
      },
      set href(value: string) {
        windowLocationHref = value;
      },
    } as Location;
  });

  afterEach(() => {
    // Restore original location
    window.location = originalLocation;
  });

  describe("Scenario: Clears storage when storageKeys provided", () => {
    it("should call clearClientStorage with provided keys before AuthService.logout", async () => {
      const storageKeys = ["user", "person", "recentPages"];
      const callOrder: string[] = [];

      vi.mocked(clearClientStorage).mockImplementation(() => {
        callOrder.push("clearClientStorage");
      });
      vi.mocked(AuthService.logout).mockImplementation(async () => {
        callOrder.push("AuthService.logout");
      });

      render(<Logout storageKeys={storageKeys} />);

      await waitFor(() => {
        expect(clearClientStorage).toHaveBeenCalledWith(storageKeys);
      });

      expect(AuthService.logout).toHaveBeenCalled();
      expect(callOrder[0]).toBe("clearClientStorage");
      expect(callOrder[1]).toBe("AuthService.logout");
    });

    it("should redirect to home page after logout", async () => {
      const storageKeys = ["user"];

      render(<Logout storageKeys={storageKeys} />);

      await waitFor(() => {
        expect(windowLocationHref).toBe("/");
      });
    });
  });

  describe("Scenario: Backward compatible without storageKeys", () => {
    it("should not call clearClientStorage when storageKeys is not provided", async () => {
      render(<Logout />);

      await waitFor(() => {
        expect(AuthService.logout).toHaveBeenCalled();
      });

      expect(clearClientStorage).not.toHaveBeenCalled();
    });

    it("should not call clearClientStorage when storageKeys is empty array", async () => {
      render(<Logout storageKeys={[]} />);

      await waitFor(() => {
        expect(AuthService.logout).toHaveBeenCalled();
      });

      expect(clearClientStorage).not.toHaveBeenCalled();
    });

    it("should still redirect to home page without storageKeys", async () => {
      render(<Logout />);

      await waitFor(() => {
        expect(windowLocationHref).toBe("/");
      });
    });
  });
});
