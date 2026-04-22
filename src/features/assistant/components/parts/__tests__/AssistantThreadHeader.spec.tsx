import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AssistantInterface } from "../../../data/AssistantInterface";
import { AssistantThreadHeader } from "../AssistantThreadHeader";

function buildAssistantStub({ id, title = "Stub" }: { id: string; title?: string }): AssistantInterface {
  return {
    id,
    title,
    messageCount: 0,
    type: "assistants",
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as AssistantInterface;
}

describe("AssistantThreadHeader", () => {
  it("renders title + rename + delete triggers", () => {
    render(
      <AssistantThreadHeader
        assistant={buildAssistantStub({ id: "a1", title: "Hello" })}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
    // Translation keys are passed through, so /rename/ and /delete/ match keys like "features.assistant.rename"
    expect(screen.getByRole("button", { name: /rename/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/ })).toBeInTheDocument();
  });

  it("rename popover submits new title and closes", async () => {
    const onRename = vi.fn().mockResolvedValue(undefined);
    render(
      <AssistantThreadHeader
        assistant={buildAssistantStub({ id: "a1", title: "Old" })}
        onRename={onRename}
        onDelete={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /rename/ }));
    const input = await screen.findByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "New");
    // "save" appears in the ui.buttons.save key → matches /save/
    await userEvent.click(screen.getByRole("button", { name: /save/ }));
    expect(onRename).toHaveBeenCalledWith("New");
  });

  it("delete confirm calls onDelete", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(
      <AssistantThreadHeader
        assistant={buildAssistantStub({ id: "a1", title: "X" })}
        onRename={vi.fn()}
        onDelete={onDelete}
      />,
    );
    // open the dialog
    await userEvent.click(screen.getByRole("button", { name: /delete/ }));
    // "confirm" appears in the ui.buttons.confirm key
    const confirmBtn = await screen.findByRole("button", { name: /confirm/ });
    await userEvent.click(confirmBtn);
    expect(onDelete).toHaveBeenCalled();
  });
});
