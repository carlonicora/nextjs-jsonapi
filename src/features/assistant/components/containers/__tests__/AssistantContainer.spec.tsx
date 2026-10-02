vi.mock("../../../../../contexts/SocketContext", () => ({
  useSocketContext: () => ({ socket: null, isConnected: false }),
}));

vi.mock("../../../../../components/containers/RoundPageContainer", () => ({
  RoundPageContainer: ({
    children,
    details,
    detailsTitle,
  }: {
    children: React.ReactNode;
    details?: React.ReactNode;
    detailsTitle?: React.ReactNode;
  }) => (
    <div data-testid="round-page-container">
      {children}
      <div data-testid="round-page-details">
        {detailsTitle}
        {details}
      </div>
    </div>
  ),
}));

import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AssistantProvider } from "../../../contexts/AssistantContext";
import { AssistantService } from "../../../data/AssistantService";
import type { JsonApiHydratedDataInterface } from "../../../../../core";
import { AssistantContainer } from "../AssistantContainer";
import { ModuleRegistry } from "../../../../../core/registry/ModuleRegistry";
import { configureI18n } from "../../../../../i18n";
import { DataClassRegistry } from "../../../../../core/registry/DataClassRegistry";
import { Assistant } from "../../../data/Assistant";
import { AssistantMessage } from "../../../../assistant-message/data/AssistantMessage";

beforeAll(() => {
  // The package Link resolves its inner component at runtime and throws if i18n
  // was never configured (src/i18n/config.ts).
  configureI18n({
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
    useTranslations: () => (key: string) => key,
    usePathname: () => "/",
    Link: ({
      href,
      children,
      prefetch: _prefetch,
      ...rest
    }: {
      href: string;
      children: React.ReactNode;
      [key: string]: any;
    }) => (
      <a href={href} {...rest}>
        {children}
      </a>
    ),
  });
  Element.prototype.scrollIntoView = vi.fn();
  const assistantModule = { name: "assistants", model: Assistant } as any;
  const assistantMessageModule = { name: "assistant-messages", model: AssistantMessage } as any;
  DataClassRegistry.registerObjectClass(assistantModule, Assistant);
  DataClassRegistry.registerObjectClass(assistantMessageModule, AssistantMessage);
  ModuleRegistry.register("Assistant" as any, assistantModule as any);
  ModuleRegistry.register("AssistantMessage" as any, assistantMessageModule as any);
  ModuleRegistry.register("Npc" as any, { name: "npcs", pageUrl: "/npcs" } as any);
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

function buildMessageDehydrated({ id, content }: { id: string; content: string }): JsonApiHydratedDataInterface {
  return {
    jsonApi: {
      type: "assistant-messages",
      id,
      attributes: { role: "user", content, position: 1 },
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

  it("passes renderMention through to messages", () => {
    const active = buildAssistantDehydrated({ id: "a1", title: "T" });
    const messages = [buildMessageDehydrated({ id: "m1", content: "Ask [X](mention://npcs/n1) about it." })];
    render(
      <AssistantProvider dehydratedAssistant={active} dehydratedMessages={messages}>
        <AssistantContainer
          renderMention={({ type, id, alias }) => <span data-testid="custom-mention">{`${type}:${id}:${alias}`}</span>}
        />
      </AssistantProvider>,
    );
    expect(screen.getByTestId("custom-mention")).toHaveTextContent("npcs:n1:X");
  });

  it("uses EntityMentionLink by default", () => {
    const active = buildAssistantDehydrated({ id: "a1", title: "T" });
    const messages = [buildMessageDehydrated({ id: "m1", content: "Ask [X](mention://npcs/n1) about it." })];
    render(
      <AssistantProvider dehydratedAssistant={active} dehydratedMessages={messages}>
        <AssistantContainer />
      </AssistantProvider>,
    );
    expect(screen.getByRole("link", { name: "X" })).toHaveAttribute("href", "/npcs/n1");
  });

  it("embedded renders without RoundPageContainer", async () => {
    const { unmount } = render(
      <AssistantProvider>
        <AssistantContainer />
      </AssistantProvider>,
    );
    expect(screen.getByTestId("round-page-container")).toBeInTheDocument();
    unmount();

    render(
      <AssistantProvider>
        <AssistantContainer embedded />
      </AssistantProvider>,
    );
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "features.assistant.empty_state.title" })).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("round-page-container")).not.toBeInTheDocument();
  });

  it("renderScopePicker shows only before the first message", async () => {
    AssistantService.create = vi.fn().mockImplementation(() => new Promise(() => {}));

    render(
      <AssistantProvider>
        <AssistantContainer renderScopePicker={() => <div data-testid="scope-picker" />} />
      </AssistantProvider>,
    );
    expect(screen.getByTestId("scope-picker")).toBeInTheDocument();

    const textarea = await screen.findByRole("textbox");
    const user = (await import("@testing-library/user-event")).default.setup();
    await user.type(textarea, "first one");
    await user.keyboard("{Enter}");

    await waitFor(() => expect(screen.queryByTestId("scope-picker")).not.toBeInTheDocument());
  });

  it("shows the operator toggle by default", async () => {
    render(
      <AssistantProvider>
        <AssistantContainer />
      </AssistantProvider>,
    );
    await waitFor(() => expect(screen.getByText("features.assistant.operator_mode")).toBeInTheDocument());
  });

  it("showOperatorToggle={false} hides the operator toggle", async () => {
    render(
      <AssistantProvider>
        <AssistantContainer showOperatorToggle={false} />
      </AssistantProvider>,
    );
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "features.assistant.empty_state.title" })).toBeInTheDocument(),
    );
    expect(screen.queryByText("features.assistant.operator_mode")).not.toBeInTheDocument();
  });

  it("page: thread list sits in the details panel, without its own new button", async () => {
    AssistantService.findMany = vi.fn().mockResolvedValue([]);
    render(
      <AssistantProvider>
        <AssistantContainer />
      </AssistantProvider>,
    );
    const details = screen.getByTestId("round-page-details");
    expect(details).toHaveTextContent("features.assistant.list_title");
    await waitFor(() => expect(details).toHaveTextContent("features.assistant.empty_sidebar"));
    expect(screen.queryByRole("button", { name: /features\.assistant\.new/ })).not.toBeInTheDocument();
  });

  it("embedded: keeps the sidebar with its new button", async () => {
    render(
      <AssistantProvider>
        <AssistantContainer embedded />
      </AssistantProvider>,
    );
    expect(screen.getByRole("button", { name: /features\.assistant\.new/ })).toBeInTheDocument();
  });
});
