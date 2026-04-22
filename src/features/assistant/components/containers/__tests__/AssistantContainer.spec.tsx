vi.mock("../../../../../contexts/SocketContext", () => ({
  useSocketContext: () => ({ socket: null, isConnected: false }),
}));

import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AssistantProvider } from "../../../contexts/AssistantContext";
import { AssistantService } from "../../../data/AssistantService";
import type { AssistantInterface } from "../../../data/AssistantInterface";
import { AssistantContainer } from "../AssistantContainer";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  AssistantService.findMany = vi.fn().mockResolvedValue([]);
});

function buildAssistantStub({ id, title = "Stub" }: { id: string; title?: string }): AssistantInterface {
  return {
    id,
    title,
    messageCount: 0,
    type: "assistants",
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as AssistantInterface;
}

describe("AssistantContainer", () => {
  it("shows empty state when no assistant is active", async () => {
    render(
      <AssistantProvider>
        <AssistantContainer />
      </AssistantProvider>,
    );
    // AssistantEmptyState renders heading with translation key
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "features.assistant.empty_state.title" })).toBeInTheDocument(),
    );
  });

  it("shows thread header + composer when an assistant is active", async () => {
    const active = buildAssistantStub({ id: "a1", title: "T" });
    render(
      <AssistantProvider dehydratedAssistant={active}>
        <AssistantContainer />
      </AssistantProvider>,
    );
    // Header shows the assistant title
    expect(screen.getByText("T")).toBeInTheDocument();
    // Composer has a textarea
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});
