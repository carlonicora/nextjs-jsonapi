import { act, render } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * BlockNote emits one change when an empty editor mounts (it inserts its trailing empty
 * paragraph). Reported to the parent, that no-op became a save on every page view (an autosave
 * of an empty field), and offline a queued change. The editor reports a change unless the text
 * went from empty to still empty. Mocks as in BlockNoteEditor.ai.spec.tsx, plus the view's
 * onChange and the editor's replaceBlocks.
 */
const h = vi.hoisted(() => {
  const AIExtension = vi.fn((options: unknown) => ({ aiFactory: true, options }));
  return {
    AIExtension,
    editorsCreated: 0,
    company: undefined as { id: string } | undefined,
    editor: undefined as any,
    ai: undefined as any,
    transportConfig: undefined as any,
    viewOnChange: undefined as undefined | (() => void),
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
          replaceBlocks: (_old: unknown, blocks: any[]) => {
            editor.document = blocks;
          },
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
    BlockNoteView: ({
      editor,
      children,
      onChange,
    }: {
      editor: unknown;
      children: React.ReactNode;
      onChange?: () => void;
    }) => {
      h.viewOnChange = onChange;
      return <EditorContext.Provider value={editor}>{children}</EditorContext.Provider>;
    },
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

const emptyParagraph = () => [{ id: "p0", type: "paragraph", props: {}, content: [], children: [] }];
const textParagraph = (text: string) => [
  { id: "p1", type: "paragraph", props: {}, content: [{ type: "text", text, styles: {} }], children: [] },
];

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function emit(document: any[]): Promise<void> {
  h.editor.document = document;
  await act(async () => {
    h.viewOnChange?.();
    await flush();
  });
}

describe("BlockNoteEditor change reports", () => {
  const onChange = vi.fn();

  beforeEach(() => {
    onChange.mockReset();
    h.viewOnChange = undefined;
  });

  it("does not report the change an empty editor emits when it mounts (empty to still empty)", async () => {
    render(<BlockNoteEditor id="npc-1" type="npcs" onChange={onChange} />);
    await emit(emptyParagraph());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("reports typing into an empty editor, then clearing it again", async () => {
    render(<BlockNoteEditor id="npc-1" type="npcs" onChange={onChange} />);
    await emit(textParagraph("Hello"));
    expect(onChange).toHaveBeenLastCalledWith(textParagraph("Hello"), false, false);
    await emit(emptyParagraph());
    expect(onChange).toHaveBeenLastCalledWith(emptyParagraph(), true, false);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("reports clearing an editor that started with text, even as its first change", async () => {
    render(<BlockNoteEditor id="npc-1" type="npcs" initialContent={textParagraph("Old") as any} onChange={onChange} />);
    await emit(emptyParagraph());
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(emptyParagraph(), true, false);
  });
});
