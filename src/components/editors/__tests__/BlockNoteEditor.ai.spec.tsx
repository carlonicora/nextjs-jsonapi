import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The AI menu, AI toolbar button and AI slash items call BlockNote's
 * useExtension(AIExtension), which throws "Extension not found" when the
 * editor in context was created without the extension. These stubs keep that
 * contract: useCreateBlockNote memoises on its deps exactly like
 * @blocknote/react 0.55 (useMemo(() => BlockNoteEditor.create(options), deps)),
 * and the AI controllers throw the same error BlockNote throws.
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
    SuggestionMenuController: () => null,
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

import BlockNoteEditor, { type BlockNoteAiHandle } from "../BlockNoteEditor";

const onChange = vi.fn();

// Callers write aiConfig inline, so every parent render passes a new object.
const renderEditor = (
  aiEnabled: boolean,
  opts: { withConfig?: boolean; aiHandleRef?: React.MutableRefObject<BlockNoteAiHandle | null> } = {},
) => (
  <BlockNoteEditor
    id="npc-1"
    type="npcs"
    onChange={onChange}
    aiEnabled={aiEnabled}
    aiHandleRef={opts.aiHandleRef}
    aiConfig={
      opts.withConfig === false
        ? undefined
        : { endpoint: "text-generation/blocknote", entityType: "npcs", actions: ["fill-template"] }
    }
  />
);

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("BlockNoteEditor AI wiring", () => {
  beforeEach(() => {
    h.AIExtension.mockClear();
    h.editorsCreated = 0;
    h.company = { id: "company-1" };
  });

  it("does not rebuild the AI extension or the editor when a new but equal aiConfig object arrives", () => {
    const { rerender } = render(renderEditor(true));
    rerender(renderEditor(true));
    rerender(renderEditor(true));

    expect(h.AIExtension).toHaveBeenCalledTimes(1);
    expect(h.editorsCreated).toBe(1);
    expect(screen.getByTestId("ai-menu")).toBeInTheDocument();
  });

  it("does not rebuild the AI extension when only the company loads", () => {
    h.company = undefined;
    const { rerender } = render(renderEditor(true));
    h.company = { id: "company-1" };
    rerender(renderEditor(true));

    expect(h.AIExtension).toHaveBeenCalledTimes(1);
    expect(h.editorsCreated).toBe(1);
  });

  it("renders no AI UI while the editor has no AI config", () => {
    render(renderEditor(true, { withConfig: false }));

    expect(h.AIExtension).not.toHaveBeenCalled();
    expect(screen.queryByTestId("ai-menu")).not.toBeInTheDocument();
  });

  it("builds the AI extension but renders no AI UI while AI is disabled", () => {
    render(renderEditor(false));

    expect(h.AIExtension).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("ai-menu")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ai-toolbar-button")).not.toBeInTheDocument();
  });

  it("does not crash when the AI config arrives after mount, and then shows the AI menu", () => {
    h.company = undefined;
    const { rerender } = render(renderEditor(true, { withConfig: false }));
    expect(screen.queryByTestId("ai-menu")).not.toBeInTheDocument();

    h.company = { id: "company-1" };
    expect(() => rerender(renderEditor(true))).not.toThrow();
    expect(screen.getByTestId("ai-menu")).toBeInTheDocument();
    expect(h.AIExtension).toHaveBeenCalledTimes(1);
    expect(h.editorsCreated).toBe(2);
  });

  it("never rebuilds the editor when aiEnabled toggles, keeps typed content, and hides/shows the AI UI", () => {
    const { rerender } = render(renderEditor(true));
    const editor = h.editor;
    expect(screen.getByTestId("ai-menu")).toBeInTheDocument();

    // Text typed before credits run out.
    editor.document.push({ type: "paragraph", content: "unsaved draft" });

    rerender(renderEditor(false));
    expect(screen.queryByTestId("ai-menu")).not.toBeInTheDocument();

    rerender(renderEditor(true));
    expect(screen.getByTestId("ai-menu")).toBeInTheDocument();

    expect(h.editorsCreated).toBe(1);
    expect(h.AIExtension).toHaveBeenCalledTimes(1);
    expect(h.editor).toBe(editor);
    expect(h.editor.document).toEqual([{ type: "paragraph", content: "unsaved draft" }]);
  });

  it("closes an open AI prompt menu without throwing when AI turns off", async () => {
    const { rerender } = render(renderEditor(true));
    const ai = h.ai;
    ai.openAIMenuAtBlock("block-1");

    expect(() => rerender(renderEditor(false))).not.toThrow();
    await flush();

    expect(ai.closeAIMenu).toHaveBeenCalledTimes(1);
    expect(ai.rejectChanges).not.toHaveBeenCalled();
    expect(ai.store.state.aiMenuState).toBe("closed");
  });

  it("aborts a running AI request and rejects its changes when AI turns off", async () => {
    const { rerender } = render(renderEditor(true));
    const ai = h.ai;
    ai.store.state.aiMenuState = { blockId: "block-1", status: "ai-writing" };

    expect(() => rerender(renderEditor(false))).not.toThrow();
    await flush();

    expect(ai.abort).toHaveBeenCalledTimes(1);
    expect(ai.rejectChanges).toHaveBeenCalledTimes(1);
    expect(ai.store.state.aiMenuState).toBe("closed");
  });

  it("sends no AI request while AI is disabled", () => {
    const aiHandleRef: React.MutableRefObject<BlockNoteAiHandle | null> = { current: null };
    const { rerender } = render(renderEditor(true, { aiHandleRef }));
    const heldHandle = aiHandleRef.current;
    expect(heldHandle).not.toBeNull();

    rerender(renderEditor(false, { aiHandleRef }));
    expect(aiHandleRef.current).toBeNull();

    // A handle kept across the toggle does nothing.
    heldHandle!.invokeAi("fill-template");
    expect(h.ai.invokeAI).not.toHaveBeenCalled();

    // The transport refuses to build a request.
    const prepare = h.transportConfig.prepareSendMessagesRequest;
    expect(() => prepare({ messages: [{ role: "user", parts: [] }], body: {} })).toThrow("AI is disabled");

    rerender(renderEditor(true, { aiHandleRef }));
    const prepared = prepare({ messages: [{ role: "user", parts: [] }], body: {} });
    expect(prepared.body.messages[0].metadata.entityType).toBe("npcs");
  });
});
