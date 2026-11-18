import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssistantComposer } from "../AssistantComposer";

// Provider stub: the composer reads only operatorMode, skills and refreshSkills.
const assistantContext = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock("../../../contexts/AssistantContext", () => ({
  useAssistantContextOptional: () => assistantContext.current,
}));

function skill(name: string) {
  return { id: `id-${name}`, name, description: `${name} description` } as any;
}

function stubProvider({ operatorMode, skills }: { operatorMode: boolean; skills: any[] }) {
  const refreshSkills = vi.fn().mockResolvedValue(skills);
  assistantContext.current = { operatorMode, skills, refreshSkills };
  return refreshSkills;
}

describe("AssistantComposer", () => {
  beforeEach(() => {
    assistantContext.current = null;
  });

  it("Enter submits non-empty content and clears the textarea", async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    render(<AssistantComposer onSend={onSend} />);
    const textarea = screen.getByPlaceholderText("features.assistant.composer_placeholder");
    await userEvent.type(textarea, "hello");
    await userEvent.keyboard("{Enter}");
    expect(onSend).toHaveBeenCalledWith("hello");
    expect((textarea as HTMLTextAreaElement).value).toBe("");
  });

  it("Shift+Enter does NOT submit", async () => {
    const onSend = vi.fn();
    render(<AssistantComposer onSend={onSend} />);
    const textarea = screen.getByPlaceholderText("features.assistant.composer_placeholder");
    await userEvent.type(textarea, "multi");
    await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
    expect(onSend).not.toHaveBeenCalled();
  });

  it("Send is disabled on empty/whitespace", () => {
    render(<AssistantComposer onSend={vi.fn()} />);
    // The send button renders the raw features.assistant.send key under the test intl stub.
    const send = screen.getByRole("button", { name: /features\.assistant\.send/i });
    expect(send).toBeDisabled();
  });

  it("renders the leading slot inside the input box, before the send button", () => {
    render(<AssistantComposer onSend={vi.fn()} leading={<span data-testid="leading-slot" />} />);
    const slot = screen.getByTestId("leading-slot");
    const send = screen.getByRole("button", { name: /features\.assistant\.send/i });
    expect(slot.compareDocumentPosition(send) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(slot.closest(".rounded-lg")).toBe(send.closest(".rounded-lg"));
  });
  describe("skill menu", () => {
    const twoSkills = [skill("email"), skill("quote")];

    function textarea() {
      return screen.getByPlaceholderText("features.assistant.composer_placeholder") as HTMLTextAreaElement;
    }

    it("reads the skill list when the box gets focus, in operator mode only", () => {
      const refreshSkills = stubProvider({ operatorMode: true, skills: twoSkills });
      render(<AssistantComposer onSend={vi.fn()} />);
      fireEvent.focus(textarea());
      expect(refreshSkills).toHaveBeenCalledTimes(1);
    });

    it("does not read the skill list on focus with operator mode off", () => {
      const refreshSkills = stubProvider({ operatorMode: false, skills: twoSkills });
      render(<AssistantComposer onSend={vi.fn()} />);
      fireEvent.focus(textarea());
      expect(refreshSkills).not.toHaveBeenCalled();
    });

    it("Escape that closes the menu never reaches the sheet around the box", async () => {
      stubProvider({ operatorMode: true, skills: twoSkills });
      const sheetKeyDown = vi.fn();
      render(
        <div onKeyDown={sheetKeyDown}>
          <AssistantComposer onSend={vi.fn()} />
        </div>,
      );
      await userEvent.type(textarea(), "/");
      expect(screen.getByTestId("skill-menu")).toBeInTheDocument();
      // Typing reaches the wrapper as usual; only the Escape that closes the menu must not.
      sheetKeyDown.mockClear();
      await userEvent.keyboard("{Escape}");
      expect(screen.queryByTestId("skill-menu")).toBeNull();
      expect(sheetKeyDown).not.toHaveBeenCalled();
    });

    it("typing / opens the menu, em narrows it, arrows move, Enter inserts the name without sending", async () => {
      const refreshSkills = stubProvider({ operatorMode: true, skills: [...twoSkills, skill("embed")] });
      const onSend = vi.fn().mockResolvedValue(undefined);
      render(<AssistantComposer onSend={onSend} />);
      // Focus reads the list once (spec section 8.3); count the read the `/` makes on its own.
      await userEvent.click(textarea());
      refreshSkills.mockClear();

      await userEvent.type(textarea(), "/");
      expect(refreshSkills).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("skill-menu")).toBeInTheDocument();
      expect(screen.getByTestId("skill-menu-item-quote")).toBeInTheDocument();

      await userEvent.type(textarea(), "em");
      expect(screen.queryByTestId("skill-menu-item-quote")).not.toBeInTheDocument();
      expect(screen.getByTestId("skill-menu-item-email")).toHaveAttribute("aria-selected", "true");

      await userEvent.keyboard("{ArrowDown}");
      expect(screen.getByTestId("skill-menu-item-embed")).toHaveAttribute("aria-selected", "true");
      await userEvent.keyboard("{ArrowUp}");
      expect(screen.getByTestId("skill-menu-item-email")).toHaveAttribute("aria-selected", "true");

      await userEvent.keyboard("{Enter}");
      expect(onSend).not.toHaveBeenCalled();
      expect(textarea().value).toBe("/email ");
      expect(screen.queryByTestId("skill-menu")).not.toBeInTheDocument();
    });

    it("inserts the name at the trigger position, keeping the text before it", async () => {
      stubProvider({ operatorMode: true, skills: twoSkills });
      render(<AssistantComposer onSend={vi.fn()} />);
      await userEvent.type(textarea(), "please /qu");
      await userEvent.keyboard("{Enter}");
      expect(textarea().value).toBe("please /quote ");
    });

    it("Escape closes the menu and the next Enter sends", async () => {
      stubProvider({ operatorMode: true, skills: twoSkills });
      const onSend = vi.fn().mockResolvedValue(undefined);
      render(<AssistantComposer onSend={onSend} />);
      await userEvent.type(textarea(), "/em");
      expect(screen.getByTestId("skill-menu")).toBeInTheDocument();
      await userEvent.keyboard("{Escape}");
      expect(screen.queryByTestId("skill-menu")).not.toBeInTheDocument();
      await userEvent.keyboard("{Enter}");
      expect(onSend).toHaveBeenCalledWith("/em");
    });

    it("typing and/or never opens the menu", async () => {
      const refreshSkills = stubProvider({ operatorMode: true, skills: twoSkills });
      render(<AssistantComposer onSend={vi.fn()} />);
      // Focus reads the list once (spec section 8.3); a `/` inside a word adds no read.
      await userEvent.click(textarea());
      refreshSkills.mockClear();
      await userEvent.type(textarea(), "and/or");
      expect(screen.queryByTestId("skill-menu")).not.toBeInTheDocument();
      expect(refreshSkills).not.toHaveBeenCalled();
    });

    it("/zz with no match closes the menu and Enter sends", async () => {
      stubProvider({ operatorMode: true, skills: twoSkills });
      const onSend = vi.fn().mockResolvedValue(undefined);
      render(<AssistantComposer onSend={onSend} />);
      await userEvent.type(textarea(), "/zz");
      expect(screen.queryByTestId("skill-menu")).not.toBeInTheDocument();
      await userEvent.keyboard("{Enter}");
      expect(onSend).toHaveBeenCalledWith("/zz");
    });

    it("refreshSkills resolving [] shows no menu and Enter sends", async () => {
      const refreshSkills = vi.fn().mockResolvedValue([]);
      assistantContext.current = { operatorMode: true, skills: [], refreshSkills };
      const onSend = vi.fn().mockResolvedValue(undefined);
      render(<AssistantComposer onSend={onSend} />);
      await userEvent.type(textarea(), "/");
      await waitFor(() => expect(refreshSkills).toHaveBeenCalled());
      expect(screen.queryByTestId("skill-menu")).not.toBeInTheDocument();
      await userEvent.keyboard("{Enter}");
      expect(onSend).toHaveBeenCalledWith("/");
    });

    it("operator mode off: no menu and no call", async () => {
      const refreshSkills = stubProvider({ operatorMode: false, skills: twoSkills });
      const onSend = vi.fn().mockResolvedValue(undefined);
      render(<AssistantComposer onSend={onSend} />);
      await userEvent.type(textarea(), "/em");
      expect(screen.queryByTestId("skill-menu")).not.toBeInTheDocument();
      expect(refreshSkills).not.toHaveBeenCalled();
      await userEvent.keyboard("{Enter}");
      expect(onSend).toHaveBeenCalledWith("/em");
    });

    it("no provider: no menu, Enter sends", async () => {
      const onSend = vi.fn().mockResolvedValue(undefined);
      render(<AssistantComposer onSend={onSend} />);
      await userEvent.type(textarea(), "/em");
      expect(screen.queryByTestId("skill-menu")).not.toBeInTheDocument();
      await userEvent.keyboard("{Enter}");
      expect(onSend).toHaveBeenCalledWith("/em");
    });
  });
});
