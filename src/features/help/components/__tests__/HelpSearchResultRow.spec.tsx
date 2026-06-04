import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Command, CommandList } from "../../../../shadcnui";
import { configureJsonApi } from "../../../../client/config";
import { HelpProvider } from "../../contexts/HelpContext";
import { HelpSearchResultRow } from "../HelpSearchResultRow";
import { HowToService } from "../../../how-to/data/HowToService";

vi.mock("../../../how-to/data/HowToService", () => ({
  HowToService: { findOne: vi.fn() },
}));

const article = {
  id: "abc",
  slug: "x",
  howToType: "how-to",
  name: "X title",
  summary: "S",
} as any;

beforeEach(() => {
  vi.clearAllMocks();
  configureJsonApi({
    apiUrl: "http://localhost",
    helpContent: { brand: { label: "narr8" } },
  });
});

describe("HelpSearchResultRow", () => {
  it("renders the article title when the service returns the how-to", async () => {
    vi.mocked(HowToService.findOne).mockResolvedValue(article);
    render(
      <HelpProvider>
        <Command>
          <CommandList>
            <HelpSearchResultRow result={{ id: "abc", name: "ignored", entityType: "howtos" }} />
          </CommandList>
        </Command>
      </HelpProvider>,
    );
    expect(await screen.findByText("X title")).toBeTruthy();
  });

  it("renders disabled removed-state row when the service has no how-to", async () => {
    vi.mocked(HowToService.findOne).mockRejectedValue(new Error("not found"));
    render(
      <HelpProvider>
        <Command>
          <CommandList>
            <HelpSearchResultRow result={{ id: "ghost", name: "ignored", entityType: "howtos" }} />
          </CommandList>
        </Command>
      </HelpProvider>,
    );
    await waitFor(() => expect(HowToService.findOne).toHaveBeenCalledWith({ id: "ghost" }));
    expect(screen.queryByText("X title")).toBeNull();
  });
});
