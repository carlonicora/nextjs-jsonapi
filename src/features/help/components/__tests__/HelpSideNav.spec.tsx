import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { configureJsonApi } from "../../../../client/config";
import { HelpProvider } from "../../contexts/HelpContext";
import { HelpSideNav } from "../HelpSideNav";

// HelpSideNav now sources its list from the public API via
// HowToService.findPublished() (Plan 3b) instead of the help manifest, so the
// test mocks the service rather than seeding the manifest.
vi.mock("../../../how-to/data/HowToService", () => ({
  HowToService: { findPublished: vi.fn() },
}));
import { HowToService } from "../../../how-to/data/HowToService";

const published = [
  { id: "a", name: "Alpha", summary: "s", tags: [], howToType: "how-to", slug: "a", order: 1, draft: false },
  { id: "b", name: "Beta", summary: "s", tags: [], howToType: "how-to", slug: "b", order: 2, draft: false },
];

beforeEach(() => {
  configureJsonApi({
    apiUrl: "http://localhost",
    helpContent: { brand: { label: "narr8" } },
  });
  (HowToService.findPublished as ReturnType<typeof vi.fn>).mockResolvedValue(published as any);
});

describe("HelpSideNav", () => {
  it("lists every non-draft article", async () => {
    render(
      <HelpProvider>
        <HelpSideNav />
      </HelpProvider>,
    );
    expect(await screen.findByText("Alpha")).toBeTruthy();
    expect(await screen.findByText("Beta")).toBeTruthy();
  });

  it("filters by query", async () => {
    render(
      <HelpProvider>
        <HelpSideNav />
      </HelpProvider>,
    );
    await screen.findByText("Alpha");
    fireEvent.change(screen.getByPlaceholderText(/filter/i), { target: { value: "Bet" } });
    expect(screen.queryByText("Alpha")).toBeNull();
    expect(screen.getByText("Beta")).toBeTruthy();
  });
});
