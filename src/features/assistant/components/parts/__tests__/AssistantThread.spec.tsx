import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ApiDataInterface } from "../../../../../core";
import type { AssistantMessageInterface } from "../../../../assistant-message/data/AssistantMessageInterface";
import { AssistantThread } from "../AssistantThread";

beforeAll(() => {
  // jsdom lacks scrollIntoView
  Element.prototype.scrollIntoView = vi.fn();
});

function buildMessageStub(p: { role: "user" | "assistant"; content?: string }): AssistantMessageInterface {
  return {
    id: Math.random().toString(36).slice(2),
    type: "assistant-messages",
    role: p.role,
    content: p.content ?? "",
    position: 0,
    references: [] as ApiDataInterface[],
    suggestedQuestions: [] as string[],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as AssistantMessageInterface;
}

describe("AssistantThread", () => {
  it("renders message list + status line when sending", () => {
    const msgs = [buildMessageStub({ role: "user", content: "hi" })];
    render(
      <AssistantThread
        messages={msgs}
        sending={true}
        status="Searching..."
        onSelectFollowUp={vi.fn()}
      />,
    );
    expect(screen.getByText("hi")).toBeInTheDocument();
    expect(screen.getByText(/Searching/)).toBeInTheDocument();
  });

  it("hides status line when not sending", () => {
    render(
      <AssistantThread
        messages={[]}
        sending={false}
        status={undefined}
        onSelectFollowUp={vi.fn()}
      />,
    );
    // When not sending, AssistantStatusLine should not render → the default "thinking" key should be absent
    expect(screen.queryByText("features.assistant.thinking")).not.toBeInTheDocument();
  });
});
