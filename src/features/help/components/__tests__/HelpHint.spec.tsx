import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { configureJsonApi } from "../../../../client/config";
import { HelpProvider } from "../../contexts/HelpContext";
import { HelpHint } from "../HelpHint";
import { HowToService } from "../../../how-to/data/HowToService";

vi.mock("../../../how-to/data/HowToService", () => ({
  HowToService: { findPublished: vi.fn() },
}));

const article = {
  id: "1",
  slug: "x",
  howToType: "how-to",
  name: "X",
  summary: "S",
  contextualKeys: ["npc.editor"],
  draft: false,
} as any;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(HowToService.findPublished).mockResolvedValue([article]);
  configureJsonApi({
    apiUrl: "http://localhost",
    helpContent: { brand: { label: "narr8" } },
  });
});

describe("HelpHint", () => {
  it("renders null when no published article matches the contextKey", async () => {
    const { container } = render(
      <HelpProvider>
        <HelpHint contextKey="nope.absent" />
      </HelpProvider>,
    );
    await waitFor(() => expect(HowToService.findPublished).toHaveBeenCalled());
    expect(container.querySelector("button")).toBeNull();
  });

  it("renders the trigger when at least one published article matches", async () => {
    render(
      <HelpProvider>
        <HelpHint contextKey="npc.editor" />
      </HelpProvider>,
    );
    expect(await screen.findByLabelText(/help on this|hint/i)).toBeTruthy();
  });
});
