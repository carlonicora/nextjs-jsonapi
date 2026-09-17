import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ApiDataInterface } from "../../../../../core";
import type { AssistantMessageInterface } from "../../../../assistant-message/data/AssistantMessageInterface";
import { AssistantThread } from "../AssistantThread";

// jsdom lacks scrollIntoView. Spy on it AND record the element it was called
// on, so the auto-scroll target can be asserted, not just the options.
const scrollTargets: Element[] = [];
const scrollIntoView = vi.fn(function (this: Element) {
  scrollTargets.push(this);
});

beforeAll(() => {
  Element.prototype.scrollIntoView = scrollIntoView;
});

beforeEach(() => {
  scrollIntoView.mockClear();
  scrollTargets.length = 0;
});

function buildMessageStub(p: {
  role: "user" | "assistant";
  content?: string;
  position?: number;
}): AssistantMessageInterface {
  return {
    id: Math.random().toString(36).slice(2),
    type: "assistant-messages",
    role: p.role,
    content: p.content ?? "",
    position: p.position ?? 0,
    references: [] as ApiDataInterface[],
    citations: [],
    suggestedQuestions: [] as string[],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as AssistantMessageInterface;
}

describe("AssistantThread", () => {
  it("renders message list + status line when sending", () => {
    const msgs = [buildMessageStub({ role: "user", content: "hi" })];
    render(<AssistantThread messages={msgs} sending={true} status="Searching..." onSelectFollowUp={vi.fn()} />);
    expect(screen.getByText("hi")).toBeInTheDocument();
    expect(screen.getByText(/Searching/)).toBeInTheDocument();
  });

  it("hides status line when not sending", () => {
    render(<AssistantThread messages={[]} sending={false} status={undefined} onSelectFollowUp={vi.fn()} />);
    // When not sending, AssistantStatusLine should not render → the default "thinking" key should be absent
    expect(screen.queryByText("features.assistant.thinking")).not.toBeInTheDocument();
  });

  it("scrolls the newest message to the TOP of the viewport, not the thread bottom", () => {
    const msgs = [
      buildMessageStub({ role: "user", content: "older question", position: 0 }),
      buildMessageStub({ role: "assistant", content: "newest answer", position: 1 }),
    ];
    render(<AssistantThread messages={msgs} sending={false} onSelectFollowUp={vi.fn()} />);

    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start", behavior: "smooth" });

    // …and it must be the LAST message element that scrolled, not a trailing spacer
    expect(scrollTargets).toHaveLength(1);
    expect(scrollTargets[0].textContent).toContain("newest answer");
    expect(scrollTargets[0].textContent).not.toContain("older question");
  });
});
