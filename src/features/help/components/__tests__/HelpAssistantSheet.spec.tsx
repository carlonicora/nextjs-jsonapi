import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HelpAssistantSheet } from "../HelpAssistantSheet";

const sendMessage = vi.fn().mockResolvedValue(undefined);

vi.mock("../../../assistant/contexts/AssistantContext", () => ({
  AssistantProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAssistantContext: () => ({
    assistant: undefined,
    messages: [],
    sending: false,
    status: undefined,
    failedMessageIds: new Set(),
    sendMessage,
    retrySend: vi.fn(),
  }),
}));

describe("HelpAssistantSheet", () => {
  beforeEach(() => sendMessage.mockClear());

  it("submitting the composer calls sendMessage with howToMode: true", async () => {
    render(<HelpAssistantSheet open={true} onOpenChange={() => {}} />);

    // AssistantEmptyState renders the composer (a textarea + send button).
    const textarea = screen.getByPlaceholderText("features.assistant.composer_placeholder");
    fireEvent.change(textarea, { target: { value: "how do scenes work?" } });

    // The empty-state composer's send button is found by its visible text.
    const sendButton = screen.getByRole("button", { name: /save|send/i });
    fireEvent.click(sendButton);

    expect(sendMessage).toHaveBeenCalledWith("how do scenes work?", { howToMode: true });
  });
});
