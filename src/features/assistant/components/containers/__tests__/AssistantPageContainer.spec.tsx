vi.mock("../../../../../contexts/SocketContext", () => ({
  useSocketContext: () => ({ socket: null, isConnected: false }),
}));

vi.mock("../../../../../components/containers/RoundPageContainer", () => ({
  RoundPageContainer: ({ children, details }: { children: React.ReactNode; details?: React.ReactNode }) => (
    <div data-testid="round-page-container">
      {children}
      {details}
    </div>
  ),
}));

// The BlockNote composer does not run in jsdom; a stub is enough to see whether it renders.
vi.mock("../../parts/AssistantBlockNoteComposer", () => ({
  AssistantBlockNoteComposer: () => <div data-testid="blocknote-composer" />,
}));

import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AssistantProvider } from "../../../contexts/AssistantContext";
import { AssistantService } from "../../../data/AssistantService";
import type { JsonApiHydratedDataInterface } from "../../../../../core";
import { AssistantPageContainer } from "../AssistantPageContainer";
import { ModuleRegistry } from "../../../../../core/registry/ModuleRegistry";
import { configureI18n } from "../../../../../i18n";
import { DataClassRegistry } from "../../../../../core/registry/DataClassRegistry";
import { Assistant } from "../../../data/Assistant";
import { AssistantMessage } from "../../../../assistant-message/data/AssistantMessage";

beforeAll(() => {
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
});

beforeEach(() => {
  AssistantService.findMany = vi.fn().mockResolvedValue([]);
  AssistantService.appendMessage = vi.fn().mockImplementation(() => new Promise(() => {}));
  AssistantService.appendMessageOperator = vi.fn().mockImplementation(() => new Promise(() => {}));
  AssistantService.create = vi.fn().mockImplementation(() => new Promise(() => {}));
});

const assistant: JsonApiHydratedDataInterface = {
  jsonApi: { type: "assistants", id: "a1", attributes: { title: "T", messageCount: 1 } },
  included: [],
};

const messages: JsonApiHydratedDataInterface[] = [
  {
    jsonApi: {
      type: "assistant-messages",
      id: "m1",
      attributes: { role: "assistant", content: "Answer", position: 1, suggestedQuestions: ["Why?"] },
    },
    included: [],
  },
];

function renderPage(composerNotice?: React.ReactNode) {
  return render(
    <AssistantProvider dehydratedAssistant={assistant} dehydratedMessages={messages}>
      <AssistantPageContainer detailsTitle="Threads" detailsIcon={null} composerNotice={composerNotice} />
    </AssistantProvider>,
  );
}

describe("AssistantPageContainer", () => {
  it("renders the composer and enabled follow-ups by default", () => {
    renderPage();
    expect(screen.getByTestId("blocknote-composer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Why?" })).toBeEnabled();
  });

  it("composerNotice replaces the composer and disables the follow-ups", () => {
    renderPage(<p>Upgrade to send</p>);
    expect(screen.getByText("Upgrade to send")).toBeInTheDocument();
    expect(screen.queryByTestId("blocknote-composer")).not.toBeInTheDocument();
    const followUp = screen.getByRole("button", { name: "Why?" });
    expect(followUp).toBeDisabled();
    fireEvent.click(followUp);
    expect(AssistantService.appendMessage).not.toHaveBeenCalled();
    expect(AssistantService.appendMessageOperator).not.toHaveBeenCalled();
    expect(AssistantService.create).not.toHaveBeenCalled();
  });
});
