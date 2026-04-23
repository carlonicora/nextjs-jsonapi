vi.mock("../../../../../contexts/SocketContext", () => ({
  useSocketContext: () => ({ socket: null, isConnected: false }),
}));

vi.mock("../../../../../components/containers/RoundPageContainer", () => ({
  RoundPageContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AssistantProvider } from "../../../contexts/AssistantContext";
import { AssistantService } from "../../../data/AssistantService";
import type { JsonApiHydratedDataInterface } from "../../../../../core";
import { AssistantContainer } from "../AssistantContainer";
import { ModuleRegistry } from "../../../../../core/registry/ModuleRegistry";
import { DataClassRegistry } from "../../../../../core/registry/DataClassRegistry";
import { Assistant } from "../../../data/Assistant";
import { AssistantMessage } from "../../../../assistant-message/data/AssistantMessage";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  const assistantModule = { name: "assistants", model: Assistant } as any;
  const assistantMessageModule = { name: "assistant-messages", model: AssistantMessage } as any;
  DataClassRegistry.registerObjectClass(assistantModule, Assistant);
  DataClassRegistry.registerObjectClass(assistantMessageModule, AssistantMessage);
  ModuleRegistry.register("Assistant" as any, assistantModule as any);
  ModuleRegistry.register("AssistantMessage" as any, assistantMessageModule as any);
});

beforeEach(() => {
  AssistantService.findMany = vi.fn().mockResolvedValue([]);
});

function buildAssistantDehydrated({
  id,
  title = "Stub",
}: {
  id: string;
  title?: string;
}): JsonApiHydratedDataInterface {
  return {
    jsonApi: {
      type: "assistants",
      id,
      attributes: { title, messageCount: 0 },
    },
    included: [],
  };
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
    const active = buildAssistantDehydrated({ id: "a1", title: "T" });
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

  it("shows thread view (not empty state) when sending a first message before assistant resolves", async () => {
    // Keep `AssistantService.create` pending so the assistant is never set.
    AssistantService.create = vi.fn().mockImplementation(() => new Promise(() => {}));

    render(
      <AssistantProvider>
        <AssistantContainer />
      </AssistantProvider>,
    );

    // Kick off a send via the composer. The AssistantEmptyState renders its own composer.
    const textarea = await screen.findByRole("textbox");
    const user = (await import("@testing-library/user-event")).default.setup();
    await user.type(textarea, "first one");
    await user.keyboard("{Enter}");

    // Empty-state title disappears; optimistic user bubble visible.
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "features.assistant.empty_state.title" })).not.toBeInTheDocument();
    });
    expect(screen.getByText("first one")).toBeInTheDocument();
    // Status line is showing ("thinking…" translation key renders literally in tests).
    expect(screen.getByText("features.assistant.thinking")).toBeInTheDocument();
  });
});
