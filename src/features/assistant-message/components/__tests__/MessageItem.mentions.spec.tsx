import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "../../../../testing";
import type { AssistantMessageInterface } from "../../data/AssistantMessageInterface";
import { MessageItem } from "../MessageItem";

const message = {
  id: "m1",
  type: "assistant-messages",
  role: "assistant",
  position: 1,
  content: "Ask [The Quiet One](mention://npcs/npc-1) about it.",
  references: [],
  citations: [],
  suggestedQuestions: [],
} as unknown as AssistantMessageInterface;

describe("MessageItem mention rendering", () => {
  it("hands mention links to renderMention", () => {
    renderWithProviders(
      <MessageItem
        message={message}
        isLatestAssistant={false}
        onSelectFollowUp={vi.fn()}
        renderMention={({ type, id, alias }) => <span data-testid="mention">{`${type}:${id}:${alias}`}</span>}
      />,
    );
    expect(screen.getByTestId("mention")).toHaveTextContent("npcs:npc-1:The Quiet One");
  });

  it("renders a plain link when no renderer is supplied", () => {
    renderWithProviders(<MessageItem message={message} isLatestAssistant={false} onSelectFollowUp={vi.fn()} />);
    expect(screen.getByText("The Quiet One")).toBeInTheDocument();
  });
});
