import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { AbstractApiData } from "../../../../core/abstracts/AbstractApiData";
import { DataClassRegistry } from "../../../../core/registry/DataClassRegistry";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import type { ApiRequestDataTypeInterface } from "../../../../core/interfaces/ApiRequestDataTypeInterface";
import type { ApiDataInterface } from "../../../../core";
import type { AssistantMessageInterface } from "../../data/AssistantMessageInterface";
import { MessageItem } from "../MessageItem";

// Test-only account model to exercise the sources panel references list
class TestAccount extends AbstractApiData {
  static identifierFields: string[] = ["name"];
  rehydrate(data: any): this {
    super.rehydrate(data);
    return this;
  }
  createJsonApi(): any {
    return {};
  }
}
const testAccountModule = {
  name: "test-accounts",
  pageUrl: "/accounts",
  model: TestAccount,
} as unknown as ApiRequestDataTypeInterface;

beforeAll(() => {
  DataClassRegistry.clear();
  DataClassRegistry.registerObjectClass(testAccountModule, TestAccount);
  ModuleRegistry.register("TestAccount" as any, testAccountModule as any);
});
afterAll(() => DataClassRegistry.clear());

function makeRehydratedAccount({ id, name }: { id: string; name: string }): ApiDataInterface {
  const acct = new TestAccount();
  acct.rehydrate({ jsonApi: { type: "test-accounts", id, attributes: { name } }, included: [] });
  return acct as unknown as ApiDataInterface;
}

function buildMessageStub(p: {
  role: "user" | "assistant";
  content?: string;
  references?: ApiDataInterface[];
  suggestedQuestions?: string[];
  skillsUsed?: string[];
}): AssistantMessageInterface {
  return {
    id: Math.random().toString(36).slice(2),
    type: "assistant-messages",
    role: p.role,
    content: p.content ?? "",
    position: 0,
    references: p.references ?? [],
    citations: [],
    suggestedQuestions: p.suggestedQuestions ?? [],
    skillsUsed: p.skillsUsed ?? [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as AssistantMessageInterface;
}

describe("MessageItem", () => {
  // rtl-ok: prose in the test name, not a CSS class
  it("user message is in a right-aligned bubble with plain text", () => {
    const msg = buildMessageStub({ role: "user", content: "hello" });
    render(<MessageItem message={msg} isLatestAssistant={false} onSelectFollowUp={vi.fn()} />);
    expect(screen.getByText("hello")).toBeInTheDocument();
    // User bubble shouldn't include the assistant agent label
    expect(screen.queryByText("features.assistant.agent_name")).not.toBeInTheDocument();
  });

  it("assistant message renders agent label and the sources panel toggle when sources exist", () => {
    const msg = buildMessageStub({
      role: "assistant",
      content: "**bold** reply",
      references: [makeRehydratedAccount({ id: "acc-1", name: "Acme" })],
      suggestedQuestions: ["follow-up 1"],
    });
    render(<MessageItem message={msg} isLatestAssistant={true} onSelectFollowUp={vi.fn()} />);
    expect(screen.getByText("features.assistant.agent_name")).toBeInTheDocument();
    // The MessageSourcesPanel toggle uses the message.sources.toggle translation key.
    expect(screen.getByRole("button", { name: /sources\.toggle/i })).toBeInTheDocument();
  });

  it("assistant message NOT latest with only suggestions: no sources panel rendered", () => {
    const msg = buildMessageStub({ role: "assistant", content: "prior", suggestedQuestions: ["x"] });
    const { container } = render(<MessageItem message={msg} isLatestAssistant={false} onSelectFollowUp={vi.fn()} />);
    // No sources/citations/references and suggestions are gated by isLatestAssistant -> panel renders nothing.
    expect(screen.queryByRole("button", { name: /sources\.toggle/i })).not.toBeInTheDocument();
    // Sanity: the assistant bubble itself still rendered.
    expect(container).not.toBeEmptyDOMElement();
  });

  it("failed user message: renders retry control and calls onRetry with the id", async () => {
    const msg = buildMessageStub({ role: "user", content: "oops" });
    (msg as any).id = "tmp-123";
    const onRetry = vi.fn();

    render(
      <MessageItem
        message={msg}
        isLatestAssistant={false}
        onSelectFollowUp={vi.fn()}
        failedMessageIds={new Set(["tmp-123"])}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText("features.assistant.send_failed")).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: "features.assistant.retry" });
    retryBtn.click();
    expect(onRetry).toHaveBeenCalledWith("tmp-123");
  });
  it("assistant message with skillsUsed renders the labels row between the answer bubble and the sources", () => {
    const msg = buildMessageStub({
      role: "assistant",
      content: "the answer",
      references: [makeRehydratedAccount({ id: "acc-2", name: "Acme" })],
      skillsUsed: ["email"],
    });
    render(<MessageItem message={msg} isLatestAssistant={true} onSelectFollowUp={vi.fn()} />);
    const labels = screen.getByTestId("message-skill-labels");
    expect(screen.getByTestId("message-skill-label-email")).toBeInTheDocument();
    const answer = screen.getByText("the answer");
    const toggle = screen.getByRole("button", { name: /sources\.toggle/i });
    expect(answer.compareDocumentPosition(labels) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(labels.compareDocumentPosition(toggle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("assistant message with no skillsUsed renders no labels row", () => {
    const msg = buildMessageStub({ role: "assistant", content: "plain", skillsUsed: [] });
    render(<MessageItem message={msg} isLatestAssistant={true} onSelectFollowUp={vi.fn()} />);
    expect(screen.queryByTestId("message-skill-labels")).not.toBeInTheDocument();
  });

  it("user message never renders the labels row", () => {
    const msg = buildMessageStub({ role: "user", content: "/email hi", skillsUsed: ["email"] });
    render(<MessageItem message={msg} isLatestAssistant={false} onSelectFollowUp={vi.fn()} />);
    expect(screen.queryByTestId("message-skill-labels")).not.toBeInTheDocument();
  });
});
