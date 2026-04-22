import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { AbstractApiData } from "../../../../core/abstracts/AbstractApiData";
import { DataClassRegistry } from "../../../../core/registry/DataClassRegistry";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import type { ApiRequestDataTypeInterface } from "../../../../core/interfaces/ApiRequestDataTypeInterface";
import type { ApiDataInterface } from "../../../../core";
import type { AssistantMessageInterface } from "../../data/AssistantMessageInterface";
import { MessageItem } from "../MessageItem";

// Test-only account model to exercise ReferenceBadges
class TestAccount extends AbstractApiData {
  static identifierFields: string[] = ["name"];
  rehydrate(data: any): this { super.rehydrate(data); return this; }
  createJsonApi(): any { return {}; }
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
}): AssistantMessageInterface {
  return {
    id: Math.random().toString(36).slice(2),
    type: "assistant-messages",
    role: p.role,
    content: p.content ?? "",
    position: 0,
    references: p.references ?? [],
    suggestedQuestions: p.suggestedQuestions ?? [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as AssistantMessageInterface;
}

describe("MessageItem", () => {
  it("user message is in a right-aligned bubble with plain text", () => {
    const msg = buildMessageStub({ role: "user", content: "hello" });
    render(<MessageItem message={msg} isLatestAssistant={false} onSelectFollowUp={vi.fn()} />);
    expect(screen.getByText("hello")).toBeInTheDocument();
    // User bubble shouldn't include the assistant agent label
    expect(screen.queryByText("features.assistant.agent_name")).not.toBeInTheDocument();
  });

  it("assistant message renders bubble, references, and suggestions toggle when latest", () => {
    const msg = buildMessageStub({
      role: "assistant",
      content: "**bold** reply",
      references: [makeRehydratedAccount({ id: "acc-1", name: "Acme" })],
      suggestedQuestions: ["follow-up 1"],
    });
    render(<MessageItem message={msg} isLatestAssistant={true} onSelectFollowUp={vi.fn()} />);
    expect(screen.getByText("features.assistant.agent_name")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /acme/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /show_suggestions/ })).toBeInTheDocument();
  });

  it("assistant message NOT latest: no suggestions toggle", () => {
    const msg = buildMessageStub({ role: "assistant", content: "prior", suggestedQuestions: ["x"] });
    render(<MessageItem message={msg} isLatestAssistant={false} onSelectFollowUp={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /show_suggestions/ })).not.toBeInTheDocument();
  });
});
