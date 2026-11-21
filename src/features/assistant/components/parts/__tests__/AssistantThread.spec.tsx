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

  it("renderAfterMessage is called after each message with its neighbours and its output follows the message", () => {
    const first = buildMessageStub({ role: "user", content: "first text", position: 0 });
    const second = buildMessageStub({ role: "assistant", content: "second text", position: 1 });
    const renderAfterMessage = vi.fn(
      (
        m: AssistantMessageInterface,
        _neighbours: { previous?: AssistantMessageInterface; next?: AssistantMessageInterface },
      ) => <span data-testid={"after-" + m.id} />,
    );

    render(
      <AssistantThread
        messages={[first, second]}
        sending={false}
        onSelectFollowUp={vi.fn()}
        renderAfterMessage={renderAfterMessage}
      />,
    );

    const afterFirst = screen.getByTestId("after-" + first.id);
    expect(screen.getByTestId("after-" + second.id)).toBeInTheDocument();
    const secondCall = renderAfterMessage.mock.calls.find((call) => call[0] === second);
    expect(secondCall?.[1]).toEqual({ previous: first, next: undefined });
    const firstCall = renderAfterMessage.mock.calls.find((call) => call[0] === first);
    expect(firstCall?.[1]).toEqual({ previous: undefined, next: second });
    const secondText = screen.getByText("second text");
    expect(afterFirst.compareDocumentPosition(secondText) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders each row as before when renderBesideMessage is omitted", () => {
    const only = buildMessageStub({ role: "assistant", content: "plain reply", position: 0 });
    const { container } = render(<AssistantThread messages={[only]} sending={false} onSelectFollowUp={vi.fn()} />);
    expect(container.querySelector("[data-message-row]")).toBeNull();
    expect(container.querySelector("[data-message-beside]")).toBeNull();
    const bubble = screen.getByText("plain reply").closest(".max-w-\\[78\\%\\]");
    expect(bubble).not.toBeNull();
  });

  it("renderBesideMessage puts its output in a second column of the message's row, with the same neighbours", () => {
    const question = buildMessageStub({ role: "user", content: "the question", position: 0 });
    const reply = buildMessageStub({ role: "assistant", content: "the reply", position: 1 });
    const renderBesideMessage = vi.fn(
      (
        m: AssistantMessageInterface,
        _neighbours: { previous?: AssistantMessageInterface; next?: AssistantMessageInterface },
      ) => (m.role === "assistant" ? <span data-testid={"beside-" + m.id} /> : null),
    );

    const { container } = render(
      <AssistantThread
        messages={[question, reply]}
        sending={false}
        onSelectFollowUp={vi.fn()}
        renderBesideMessage={renderBesideMessage}
      />,
    );

    const replyRow = container.querySelector('[data-message-row="' + reply.id + '"]');
    expect(replyRow?.className).toContain("lg:grid-cols-2");
    const beside = screen.getByTestId("beside-" + reply.id);
    expect(beside.parentElement?.getAttribute("data-message-beside")).toBe(reply.id);
    expect(replyRow?.contains(beside)).toBe(true);
    expect(replyRow?.textContent).toContain("the reply");
    // A row whose renderer returns null keeps no second cell.
    const questionRow = container.querySelector('[data-message-row="' + question.id + '"]');
    expect(questionRow?.querySelector("[data-message-beside]")).toBeNull();
    const replyCall = renderBesideMessage.mock.calls.find((call) => call[0] === reply);
    expect(replyCall?.[1]).toEqual({ previous: question, next: undefined });
    // In a half-width column the reply bubble drops the default cap.
    expect(screen.getByText("the reply").closest(".max-w-full")).not.toBeNull();
  });
});
