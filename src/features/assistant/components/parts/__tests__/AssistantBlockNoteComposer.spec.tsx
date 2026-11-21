import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { AssistantBlockNoteComposer } from "../AssistantBlockNoteComposer";
import { SkillSuggestionMenu } from "../../../../skill/components/parts/SkillSuggestionMenu";

// The real editor is a next/dynamic ssr:false import; assert on the props it receives.
const editorProps = vi.hoisted(() => ({ current: null as null | Record<string, any> }));
vi.mock("../../../../../components/editors/BlockNoteEditorContainer", () => ({
  BlockNoteEditorContainer: (props: { placeholder?: string; initialContent?: unknown[] }) => {
    editorProps.current = props;
    return (
      <div
        data-testid="composer-editor"
        data-placeholder={props.placeholder}
        data-initial-content={props.initialContent === undefined ? "none" : JSON.stringify(props.initialContent)}
        tabIndex={0}
      />
    );
  },
}));

// Provider stub: the composer reads only operatorMode, skills and refreshSkills.
const assistantContext = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock("../../../contexts/AssistantContext", () => ({
  useAssistantContextOptional: () => assistantContext.current,
}));

function skill(name: string) {
  return { id: `id-${name}`, name, description: `${name} description` } as any;
}

/**
 * A stand-in for the BlockNote editor `getItems` receives: the text of the
 * current block up to the caret, the suggestion-menu extension, and the insert.
 */
function fakeEditor(textBeforeCaret: string) {
  const closeMenu = vi.fn();
  const insertInlineContent = vi.fn();
  const editor = {
    getExtension: vi.fn(() => ({ closeMenu })),
    insertInlineContent,
    prosemirrorState: {
      selection: {
        $from: {
          parentOffset: textBeforeCaret.length,
          parent: {
            textBetween: (from: number, to: number) => textBeforeCaret.slice(from, to),
          },
        },
      },
    },
  };
  return { editor: editor as any, closeMenu, insertInlineContent };
}

const paragraph = [{ type: "paragraph", content: [{ type: "text", text: "Draft text", styles: {} }] }];

describe("AssistantBlockNoteComposer", () => {
  beforeEach(() => {
    assistantContext.current = null;
    editorProps.current = null;
  });

  it("renders the given placeholder", () => {
    render(<AssistantBlockNoteComposer onSend={vi.fn()} placeholder="Type here" />);
    expect(screen.getByTestId("composer-editor")).toHaveAttribute("data-placeholder", "Type here");
  });

  it("falls back to the assistant placeholder", () => {
    render(<AssistantBlockNoteComposer onSend={vi.fn()} />);
    expect(screen.getByTestId("composer-editor")).toHaveAttribute(
      "data-placeholder",
      "features.assistant.composer_placeholder",
    );
  });

  describe("skill menu", () => {
    it("operator mode on with skills: the editor receives slashSuggestions with SkillSuggestionMenu", () => {
      assistantContext.current = { operatorMode: true, skills: [skill("email")], refreshSkills: vi.fn() };
      render(<AssistantBlockNoteComposer onSend={vi.fn()} />);
      expect(editorProps.current?.slashSuggestions?.suggestionMenuComponent).toBe(SkillSuggestionMenu);
    });

    it("getItems('') builds its items from the list refreshSkills resolves, and an item inserts /<name>", async () => {
      const fresh = [skill("email"), skill("humanizer")];
      const refreshSkills = vi.fn().mockResolvedValue(fresh);
      assistantContext.current = { operatorMode: true, skills: [skill("stale")], refreshSkills };
      render(<AssistantBlockNoteComposer onSend={vi.fn()} />);
      const { editor, closeMenu, insertInlineContent } = fakeEditor("/");

      const items = await editorProps.current!.slashSuggestions.getItems("", editor);

      expect(refreshSkills).toHaveBeenCalledTimes(1);
      expect(items.map((i: any) => i.title)).toEqual(["/email", "/humanizer"]);
      expect(items[0].subtext).toBe("email description");
      expect(items[0].id).toBe("id-email");
      expect(closeMenu).not.toHaveBeenCalled();
      items[1].onItemClick();
      expect(insertInlineContent).toHaveBeenCalledWith("/humanizer ");
    });

    it("getItems filters by prefix from the last list read, and closes the menu on no match", async () => {
      const refreshSkills = vi.fn().mockResolvedValue([skill("email"), skill("humanizer")]);
      assistantContext.current = { operatorMode: true, skills: [skill("stale")], refreshSkills };
      render(<AssistantBlockNoteComposer onSend={vi.fn()} />);
      const getItems = editorProps.current!.slashSuggestions.getItems;

      await getItems("", fakeEditor("/").editor);
      const hu = fakeEditor("/hu");
      const filtered = await getItems("hu", hu.editor);
      expect(filtered.map((i: any) => i.title)).toEqual(["/humanizer"]);
      expect(hu.closeMenu).not.toHaveBeenCalled();
      expect(refreshSkills).toHaveBeenCalledTimes(1);

      const zz = fakeEditor("/zz");
      expect(await getItems("zz", zz.editor)).toEqual([]);
      expect(zz.closeMenu).toHaveBeenCalled();
    });

    it("refreshSkills resolving [] at / time answers [] and closes the menu", async () => {
      const refreshSkills = vi.fn().mockResolvedValue([]);
      assistantContext.current = { operatorMode: true, skills: [skill("email")], refreshSkills };
      render(<AssistantBlockNoteComposer onSend={vi.fn()} />);
      const { editor, closeMenu } = fakeEditor("/");
      expect(await editorProps.current!.slashSuggestions.getItems("", editor)).toEqual([]);
      expect(closeMenu).toHaveBeenCalled();
    });

    it("a letter or digit before the / answers [] and closes the menu", async () => {
      const refreshSkills = vi.fn().mockResolvedValue([skill("email")]);
      assistantContext.current = { operatorMode: true, skills: [skill("email")], refreshSkills };
      render(<AssistantBlockNoteComposer onSend={vi.fn()} />);
      const getItems = editorProps.current!.slashSuggestions.getItems;

      const word = fakeEditor("and/");
      expect(await getItems("", word.editor)).toEqual([]);
      expect(word.closeMenu).toHaveBeenCalled();

      const date = fakeEditor("12/0");
      expect(await getItems("0", date.editor)).toEqual([]);
      expect(date.closeMenu).toHaveBeenCalled();

      const spaced = fakeEditor("send /em");
      expect((await getItems("em", spaced.editor)).map((i: any) => i.title)).toEqual(["/email"]);
      expect(spaced.closeMenu).not.toHaveBeenCalled();
    });

    it("operator mode on with no skills held yet: `/` reads the list and shows the skills it finds", async () => {
      const refreshSkills = vi.fn().mockResolvedValue([skill("email")]);
      assistantContext.current = { operatorMode: true, skills: [], refreshSkills };
      render(<AssistantBlockNoteComposer onSend={vi.fn()} />);
      const items = await editorProps.current!.slashSuggestions.getItems("", fakeEditor("/").editor);
      expect(refreshSkills).toHaveBeenCalledTimes(1);
      expect(items.map((i: any) => i.title)).toEqual(["/email"]);
    });

    it("operator mode off: the editor's block-type `/` menu is still replaced, and `/` opens nothing", async () => {
      const refreshSkills = vi.fn().mockResolvedValue([skill("email")]);
      assistantContext.current = { operatorMode: false, skills: [skill("email")], refreshSkills };
      render(<AssistantBlockNoteComposer onSend={vi.fn()} />);
      expect(editorProps.current?.slashSuggestions?.suggestionMenuComponent).toBe(SkillSuggestionMenu);
      const { editor, closeMenu } = fakeEditor("/");
      expect(await editorProps.current!.slashSuggestions.getItems("", editor)).toEqual([]);
      expect(closeMenu).toHaveBeenCalled();
      expect(refreshSkills).not.toHaveBeenCalled();
    });

    it("no provider: the editor's block-type `/` menu is still replaced, and `/` opens nothing", async () => {
      render(<AssistantBlockNoteComposer onSend={vi.fn()} />);
      expect(editorProps.current?.slashSuggestions?.suggestionMenuComponent).toBe(SkillSuggestionMenu);
      const { editor, closeMenu } = fakeEditor("/");
      expect(await editorProps.current!.slashSuggestions.getItems("", editor)).toEqual([]);
      expect(closeMenu).toHaveBeenCalled();
    });

    it("Escape while the skills menu is open closes the menu and never reaches the sheet around the box", async () => {
      const refreshSkills = vi.fn().mockResolvedValue([skill("email")]);
      assistantContext.current = { operatorMode: true, skills: [skill("email")], refreshSkills };
      const sheetKeyDown = vi.fn();
      render(
        <div onKeyDown={sheetKeyDown}>
          <AssistantBlockNoteComposer onSend={vi.fn()} />
          <div data-testid="skill-menu" />
        </div>,
      );
      // The `/` that opened the menu handed the composer its editor.
      const { editor, closeMenu } = fakeEditor("/");
      await editorProps.current!.slashSuggestions.getItems("", editor);
      closeMenu.mockClear();

      fireEvent.keyDown(screen.getByTestId("composer-editor"), { key: "Escape" });
      expect(closeMenu).toHaveBeenCalledTimes(1);
      expect(sheetKeyDown).not.toHaveBeenCalled();
    });

    it("Escape with no skills menu open still reaches the sheet (the mention menu and the box keep today's behaviour)", () => {
      assistantContext.current = { operatorMode: true, skills: [skill("email")], refreshSkills: vi.fn() };
      const sheetKeyDown = vi.fn();
      render(
        <div onKeyDown={sheetKeyDown}>
          <AssistantBlockNoteComposer onSend={vi.fn()} />
        </div>,
      );
      fireEvent.keyDown(screen.getByTestId("composer-editor"), { key: "Escape" });
      expect(sheetKeyDown).toHaveBeenCalledTimes(1);
    });

    it("calls refreshSkills when the editor gains focus", () => {
      const refreshSkills = vi.fn().mockResolvedValue([]);
      assistantContext.current = { operatorMode: true, skills: [], refreshSkills };
      render(<AssistantBlockNoteComposer onSend={vi.fn()} />);
      act(() => {
        fireEvent.focusIn(screen.getByTestId("composer-editor"));
      });
      expect(refreshSkills).toHaveBeenCalledTimes(1);
    });
  });

  it("initialContentBlocks start the editor with that content and enable Send", () => {
    render(<AssistantBlockNoteComposer onSend={vi.fn()} initialContentBlocks={paragraph} />);
    expect(screen.getByTestId("composer-editor")).toHaveAttribute("data-initial-content", JSON.stringify(paragraph));
    expect(screen.getByRole("button", { name: /features\.assistant\.send/ })).toBeEnabled();
  });

  it("after a send the editor is empty again", async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    render(<AssistantBlockNoteComposer onSend={onSend} initialContentBlocks={paragraph} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /features\.assistant\.send/ }));
    });

    expect(onSend).toHaveBeenCalledWith("Draft text", { contentBlocks: paragraph });
    expect(screen.getByTestId("composer-editor")).toHaveAttribute("data-initial-content", "none");
    expect(screen.getByRole("button", { name: /features\.assistant\.send/ })).toBeDisabled();
  });
});
