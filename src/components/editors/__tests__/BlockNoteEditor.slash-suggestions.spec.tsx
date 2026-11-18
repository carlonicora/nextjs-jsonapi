import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The host's own "/" menu (slashSuggestions). BlockNote reloads a suggestion
 * menu's items whenever its getItems prop changes identity, so the editor must
 * hand it a stable function: a new one per render reloads the items in a loop
 * (each reload re-reads the skills list and re-renders the host). Same stubs as
 * BlockNoteEditor.ai.spec.tsx, with SuggestionMenuController recording its props.
 */
const h = vi.hoisted(() => {
  const AIExtension = vi.fn((options: unknown) => ({ aiFactory: true, options }));
  return {
    AIExtension,
    editorsCreated: 0,
    company: undefined as { id: string } | undefined,
    // The last editor useCreateBlockNote built, and its AI extension instance.
    editor: undefined as any,
    ai: undefined as any,
    // Config the editor handed to DefaultChatTransport (the AI request path).
    transportConfig: undefined as any,
    // Props each "/" SuggestionMenuController render received.
    slashControllerProps: [] as any[],
  };
});

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "light" }) }));
vi.mock("../../../i18n/config", () => ({ useI18nLocale: () => "en" }));
vi.mock("../../../client/config", () => ({ getPublicApiUrl: () => "http://api.test/" }));
vi.mock("../../../client/token", () => ({ getClientToken: async () => "token" }));
vi.mock("../../../contexts", () => ({
  useCurrentUserContextOptional: () => (h.company ? { company: h.company } : undefined),
}));

vi.mock("@blocknote/react", async () => {
  const React = await import("react");
  const EditorContext = React.createContext<any>(null);
  const useBlockNoteEditor = () => React.useContext(EditorContext);
  const requireAI = (editor: any) => {
    if (!editor?.getExtension(h.AIExtension)) throw new Error("Extension not found");
  };
  return {
    EditorContext,
    createReactInlineContentSpec: (config: unknown) => ({ config }),
    getDefaultReactSlashMenuItems: () => [],
    SuggestionMenuController: (props: any) => {
      if (props.triggerCharacter === "/") h.slashControllerProps.push(props);
      return null;
    },
    useBlockNoteEditor,
    useExtension: () => {
      const editor = useBlockNoteEditor();
      requireAI(editor);
      return editor.getExtension(h.AIExtension);
    },
    useExtensionState: () => "closed",
    useCreateBlockNote: (options: any, deps: React.DependencyList = []) =>
      React.useMemo(() => {
        h.editorsCreated += 1;
        const extensions: any[] = options?.extensions ?? [];
        // Mirrors xl-ai 0.55: a store holding aiMenuState, and the calls that
        // move it back to "closed".
        const store = { state: { aiMenuState: "closed" as any } };
        const ai = {
          store,
          invokeAI: vi.fn(),
          openAIMenuAtBlock: vi.fn((blockId: string) => {
            store.state.aiMenuState = { blockId, status: "user-input" };
          }),
          abort: vi.fn(async () => {
            const menu = store.state.aiMenuState;
            if (menu !== "closed") store.state.aiMenuState = { ...menu, status: "user-reviewing" };
          }),
          closeAIMenu: vi.fn(() => {
            store.state.aiMenuState = "closed";
          }),
          rejectChanges: vi.fn(() => {
            store.state.aiMenuState = "closed";
          }),
        };
        const hasAI = extensions.some((e) => e?.aiFactory);
        const editor = {
          document: [] as any[],
          focus: () => undefined,
          getSelection: () => undefined,
          getExtension: (factory: unknown) => (factory === h.AIExtension && hasAI ? ai : undefined),
        };
        h.editor = editor;
        h.ai = hasAI ? ai : undefined;
        return editor;
      }, deps),
    BasicTextStyleButton: () => null,
    BlockTypeSelect: () => null,
    CreateLinkButton: () => null,
    FileCaptionButton: () => null,
    FileReplaceButton: () => null,
    TextAlignButton: () => null,
    FormattingToolbar: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    FormattingToolbarController: ({ formattingToolbar }: { formattingToolbar: () => React.ReactNode }) => (
      <>{formattingToolbar()}</>
    ),
    // Shared with the xl-ai stubs below.
    __requireAI: requireAI,
  };
});

vi.mock("@blocknote/shadcn", async () => {
  const { EditorContext } = (await import("@blocknote/react")) as any;
  return {
    BlockNoteView: ({ editor, children }: { editor: unknown; children: React.ReactNode }) => (
      <EditorContext.Provider value={editor}>{children}</EditorContext.Provider>
    ),
  };
});

vi.mock("@blocknote/xl-ai", async () => {
  const { useBlockNoteEditor, __requireAI } = (await import("@blocknote/react")) as any;
  return {
    AIExtension: h.AIExtension,
    AIMenuController: () => {
      __requireAI(useBlockNoteEditor());
      return <div data-testid="ai-menu" />;
    },
    AIToolbarButton: () => {
      __requireAI(useBlockNoteEditor());
      return <div data-testid="ai-toolbar-button" />;
    },
    getAISlashMenuItems: () => [],
    getDefaultAIMenuItems: () => [],
    PromptSuggestionMenu: () => null,
    useAIDictionary: () => ({}),
  };
});

vi.mock("ai", () => ({
  DefaultChatTransport: function (this: any, config: unknown) {
    h.transportConfig = config;
  },
}));
vi.mock("@blocknote/core", () => ({
  BlockNoteSchema: { create: (config: unknown) => ({ config }) },
  defaultInlineContentSpecs: {},
  filterSuggestionItems: (items: unknown[]) => items,
}));
vi.mock("@blocknote/core/locales", () => ({ en: { core: "en" } }));
vi.mock("@blocknote/xl-ai/locales", () => ({ en: { ai: "en" } }));
vi.mock("@blocknote/shadcn/style.css", () => ({}));
vi.mock("@blocknote/xl-ai/style.css", () => ({}));
vi.mock("../BlockNoteEditorMentionInlineContent", () => ({ createMentionInlineContentSpec: () => ({}) }));

import BlockNoteEditor from "../BlockNoteEditor";

const SlashMenu = () => null;
// One stable object, as the Assistant composer builds it with useMemo.
const slashSuggestions = { getItems: vi.fn(async () => []), suggestionMenuComponent: SlashMenu };

const renderEditor = (counter: number) => (
  <BlockNoteEditor
    id="assistant-1"
    type="assistant"
    onChange={() => undefined}
    placeholder={`render ${counter}`}
    slashSuggestions={slashSuggestions}
  />
);

describe("BlockNoteEditor slashSuggestions", () => {
  beforeEach(() => {
    h.slashControllerProps = [];
    h.company = { id: "company-1" };
    slashSuggestions.getItems.mockClear();
  });

  it("hands BlockNote the same getItems on every render, so the menu does not reload in a loop", () => {
    const { rerender } = render(renderEditor(1));
    rerender(renderEditor(2));
    rerender(renderEditor(3));

    const seen = new Set(h.slashControllerProps.map((props) => props.getItems));
    expect(h.slashControllerProps.length).toBeGreaterThan(1);
    expect(seen.size).toBe(1);
  });

  it("forwards the query and the editor to the host's getItems", async () => {
    render(renderEditor(1));
    await h.slashControllerProps[0].getItems("pi");

    expect(slashSuggestions.getItems).toHaveBeenCalledWith("pi", h.editor);
    expect(h.slashControllerProps[0].suggestionMenuComponent).toBe(SlashMenu);
  });
});
