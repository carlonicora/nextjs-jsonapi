import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AssistantInterface } from "../../../data/AssistantInterface";
import { AssistantSidebar } from "../AssistantSidebar";

function buildAssistantStub({
  id,
  title = "Stub",
  updatedAt = new Date(),
}: {
  id: string;
  title?: string;
  updatedAt?: Date;
}): AssistantInterface {
  return {
    id,
    title,
    messageCount: 0,
    type: "assistants",
    createdAt: updatedAt,
    updatedAt,
  } as unknown as AssistantInterface;
}

describe("AssistantSidebar", () => {
  describe("with fake timers (bucket grouping)", () => {
    beforeEach(() => vi.useFakeTimers().setSystemTime(new Date("2026-04-22T12:00:00Z")));
    afterEach(() => vi.useRealTimers());

    it("renders '+ New assistant' button and groups threads by bucket", () => {
      const threads = [
        buildAssistantStub({ id: "a1", title: "Today item", updatedAt: new Date("2026-04-22T09:00:00Z") }),
        buildAssistantStub({ id: "a2", title: "Week item", updatedAt: new Date("2026-04-20T09:00:00Z") }),
        buildAssistantStub({ id: "a3", title: "Old item", updatedAt: new Date("2026-03-01T09:00:00Z") }),
      ];
      render(<AssistantSidebar threads={threads} activeId="a1" onSelect={vi.fn()} onNew={vi.fn()} />);
      // New button: translation key includes "new" — matches /new/
      expect(screen.getByRole("button", { name: /features\.assistant\.new/ })).toBeInTheDocument();
      expect(screen.getByText("features.assistant.bucket_today")).toBeInTheDocument();
      expect(screen.getByText("features.assistant.bucket_week")).toBeInTheDocument();
      expect(screen.getByText("features.assistant.bucket_earlier")).toBeInTheDocument();
    });

    it("empty threads: shows empty_sidebar key", () => {
      render(<AssistantSidebar threads={[]} onSelect={vi.fn()} onNew={vi.fn()} />);
      expect(screen.getByText("features.assistant.empty_sidebar")).toBeInTheDocument();
    });
  });

  it("clicking a thread calls onSelect with its id", async () => {
    const onSelect = vi.fn();
    const threads = [buildAssistantStub({ id: "a1", title: "T", updatedAt: new Date("2026-04-22T09:00:00Z") })];
    render(<AssistantSidebar threads={threads} onSelect={onSelect} onNew={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /^T$/ }));
    expect(onSelect).toHaveBeenCalledWith("a1");
  });
});
