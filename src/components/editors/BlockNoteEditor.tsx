"use client";

import { BlockNoteSchema, defaultInlineContentSpecs, filterSuggestionItems, PartialBlock } from "@blocknote/core";
import { en as coreEn } from "@blocknote/core/locales";
import {
  createReactInlineContentSpec,
  DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  SuggestionMenuProps,
  useBlockNoteEditor,
  useCreateBlockNote,
  useExtension,
  useExtensionState,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import {
  AIExtension,
  AIMenuController,
  getAISlashMenuItems,
  getDefaultAIMenuItems,
  PromptSuggestionMenu,
  useAIDictionary,
} from "@blocknote/xl-ai";
import { en as aiEn } from "@blocknote/xl-ai/locales";
import "@blocknote/xl-ai/style.css";
import { DefaultChatTransport } from "ai";
import {
  CheckIcon,
  LanguagesIcon,
  LayoutTemplateIcon,
  SparklesIcon,
  TypeIcon,
  WandSparklesIcon,
  XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getPublicApiUrl } from "../../client/config";
import { getClientToken } from "../../client/token";
import { useCurrentUserContext } from "../../contexts";
import { S3Interface } from "../../features/s3/data";
import { S3Service } from "../../features/s3/data/s3.service";
import { UserInterface } from "../../features/user/data";
import { useI18nLocale } from "../../i18n/config";
import { Button } from "../../shadcnui";
import { BlockNoteDiffUtil, BlockNoteWordDiffRendererUtil, cn } from "../../utils";
import { errorToast } from "../errors";
import { BlockNoteEditorFormattingToolbar } from "./BlockNoteEditorFormattingToolbar";
import { BlockNoteEditorMentionHoverCard } from "./BlockNoteEditorMentionHoverCard";
import {
  createMentionInlineContentSpec,
  type MentionNameResolver,
  type MentionResolveFn,
} from "./BlockNoteEditorMentionInlineContent";
import { BlockNoteEditorMentionSuggestionMenu } from "./BlockNoteEditorSuggestionMenuController";

export type BlockNoteAiConfig = {
  endpoint: string;
  entityType: string;
  entityId?: string;
};

export type BlockNoteEditorProps = {
  id: string;
  type: string;
  initialContent?: PartialBlock[];
  onChange?: (content: any, isEmpty: boolean, hasUnresolvedDiff: boolean) => void;
  size?: "sm" | "md";
  className?: string;
  markdownContent?: string;
  diffContent?: PartialBlock[];
  placeholder?: string;
  bordered?: boolean;
  inlineContentSpecs?: Record<string, any>;
  renderOverlays?: (editor: any) => React.ReactNode;
  enableMentions?: boolean;
  disableMentions?: boolean;
  mentionSearchFn?: (
    query: string,
    params?: Record<string, string>,
  ) => Promise<import("./BlockNoteEditorSuggestionMenuController").MentionItem[]>;
  mentionSearchParams?: Record<string, string>;
  mentionResolveFn?: MentionResolveFn;
  suggestionMenuComponent?: React.FC<SuggestionMenuProps<DefaultReactSuggestionItem>>;
  mentionNameResolver?: MentionNameResolver;
  onWarmMentions?: (blocks: PartialBlock[]) => void;
  aiConfig?: BlockNoteAiConfig;
  // When the editor is inside a bounded flex column (parent gives it a real
  // height via flex-1+min-h-0), set this so `.bn-container` shrinks to that
  // height and scrolls internally. Without it the editor grows to fit its
  // content and pushes the surrounding form to scroll instead.
  stretch?: boolean;
};

function isBlockEmpty(block: any): boolean {
  if (!block || typeof block !== "object") return true;
  if (block.type !== "paragraph") return false;
  if (Array.isArray(block.children) && block.children.length > 0 && !isDocumentEmpty(block.children)) {
    return false;
  }
  if (Array.isArray(block.content)) {
    for (const inline of block.content) {
      if (typeof inline === "string") {
        if (inline.trim()) return false;
      } else if (inline && typeof inline === "object") {
        if (inline.type !== "text") return false;
        if (typeof inline.text === "string" && inline.text.trim()) return false;
      }
    }
  } else if (typeof block.content === "string" && block.content.trim()) {
    return false;
  }
  return true;
}

function isDocumentEmpty(blocks: any[]): boolean {
  if (!Array.isArray(blocks) || blocks.length === 0) return true;
  return blocks.every(isBlockEmpty);
}

const createDiffActionsInlineContentSpec = (
  handleAcceptChange: (diffId: string) => void,
  handleRejectChange: (diffId: string) => void,
) => {
  return createReactInlineContentSpec(
    {
      type: "diffActions",
      propSchema: {
        diffIds: {
          default: "",
        },
      },
      content: "none",
    },
    {
      render: (props) => {
        const diffIds = props.inlineContent.props.diffIds;

        return (
          <span className="diff-actions-container mx-2 inline-flex items-center gap-1 align-middle">
            <Button
              title="Accept change"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                diffIds.split(",").forEach((id: string) => handleAcceptChange(id.trim()));
              }}
            >
              <CheckIcon className="h-3 w-3 text-green-600" />
            </Button>
            <Button
              title="Reject change"
              className="mx-2 p-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                diffIds.split(",").forEach((id: string) => handleRejectChange(id.trim()));
              }}
            >
              <XIcon className="h-3 w-3 text-red-600" />
            </Button>
          </span>
        );
      },
    },
  );
};

/**
 * Custom AI menu wrapper. Surfaces our backend-driven action items
 * (Improve Writing, Fix Spelling) above the free-form prompt input.
 *
 * Why a custom wrapper instead of `<AIMenu items={…}>` with the BlockNote
 * defaults: BlockNote's `PromptSuggestionMenu` hijacks Enter to pick the
 * highlighted item whenever `items.length > 0`. We gate items on
 *   - status === "user-input"
 *   - editor has a selection
 *   - prompt input is empty
 * so the moment the user types, items disappear and Enter falls back to
 * free-form submission. Outside `user-input` (review / error states) we
 * keep BlockNote's default review buttons (accept/revert/retry/cancel).
 *
 * Each custom item passes a `type` discriminator on `chatRequestOptions.body`.
 * That field flows through `chat.sendMessage(msg, opts)` to the transport's
 * `prepareSendMessagesRequest({messages, body})` (see types.ts in
 * `@blocknote/xl-ai` — `ChatRequestOptions = Parameters<Chat["sendMessage"]>[1]`).
 * The backend dispatcher reads `body.type` and routes to a per-type handler
 * with its own canonical prompt. NO prompt text lives in this file.
 */
function NarrAIMenu() {
  const editor = useBlockNoteEditor();
  const ai = useExtension(AIExtension);
  const dict = useAIDictionary();
  const status = useExtensionState(AIExtension, {
    selector: (s) => (s.aiMenuState !== "closed" ? s.aiMenuState.status : "closed"),
  });
  const [prompt, setPrompt] = useState("");
  // Set by items that pre-fill the input (Translate) so handleSubmit knows
  // which `type` to attach when the user submits the captured text. Cleared
  // after submit or on status change.
  const pendingTypeRef = useRef<string | null>(null);

  useEffect(() => {
    if (status === "ai-writing" || status === "user-reviewing" || status === "error" || status === "closed") {
      setPrompt("");
      pendingTypeRef.current = null;
    }
  }, [status]);

  // Selection-edit ops operate per-block. If the user's selection only
  // covers part of a block (cursor mid-paragraph dragged to mid-next), the
  // rewrite would silently replace the WHOLE containing blocks — beyond
  // what the user highlighted. Expand the selection to whole-block bounds
  // BEFORE invokeAI so the user sees exactly what will be rewritten.
  const expandSelectionToBlocks = useCallback(() => {
    const sel = editor.getSelection?.();
    const blocks = (sel as any)?.blocks;
    if (!Array.isArray(blocks) || blocks.length === 0) return;
    const first = blocks[0];
    const last = blocks[blocks.length - 1];
    try {
      (editor as any).setSelection?.(first, last);
    } catch {
      // If BlockNote's setSelection signature changes, fail silently — the
      // backend still operates per-block, so we just lose the visual hint.
    }
  }, [editor]);

  const items = useMemo(() => {
    // Outside user-input (reviewing / error), use BlockNote's default
    // review buttons (accept/revert/retry/cancel). Need to wrap onItemClick
    // because the default items expect a setPrompt argument.
    if (status !== "user-input") {
      return getDefaultAIMenuItems(editor, status).map((item) => ({
        ...item,
        onItemClick: () => item.onItemClick(setPrompt),
      }));
    }
    const hasSelection = editor.getSelection() !== undefined;
    const hasTyped = prompt.trim().length > 0;
    // Once the user starts typing, hide all items so Enter submits the
    // free-form (or pending-type) prompt instead of being hijacked.
    if (hasTyped) return [];

    // Generate from Template is shown in BOTH contexts (with and without
    // selection) because it operates on the whole document — it ignores any
    // active selection and runs the per-section template-fill flow. Listed
    // first so it's the default-highlighted item.
    const generateFromTemplate = {
      key: "generate_from_template",
      title: "Generate from Template",
      aliases: ["generate", "template", "fill"],
      icon: <LayoutTemplateIcon size={18} />,
      size: "small" as const,
      onItemClick: () => {
        void ai.invokeAI({
          userPrompt: "fill-template",
          useSelection: false,
          chatRequestOptions: { body: { type: "fill-template" } },
        });
      },
    };

    if (hasSelection) {
      // Selection-edit items + the always-available Generate from Template.
      // Each selection item invokes ai.invokeAI with chatRequestOptions
      // carrying the `type` body field. The userPrompt is a short tag — the
      // backend ignores it and uses the canonical prompt for the type instead.
      return [
        generateFromTemplate,
        {
          key: "improve_writing",
          title: "Improve Writing",
          aliases: ["improve", "rewrite", "polish"],
          icon: <SparklesIcon size={18} />,
          size: "small" as const,
          onItemClick: () => {
            expandSelectionToBlocks();
            void ai.invokeAI({
              userPrompt: "improve-writing",
              useSelection: true,
              chatRequestOptions: { body: { type: "improve-writing" } },
            });
          },
        },
        {
          key: "fix_spelling",
          title: "Fix Spelling",
          aliases: ["spelling", "grammar", "typo"],
          icon: <TypeIcon size={18} />,
          size: "small" as const,
          onItemClick: () => {
            expandSelectionToBlocks();
            void ai.invokeAI({
              userPrompt: "fix-spelling",
              useSelection: true,
              chatRequestOptions: { body: { type: "fix-spelling" } },
            });
          },
        },
        {
          key: "translate",
          title: "Translate…",
          aliases: ["translate", "language"],
          icon: <LanguagesIcon size={18} />,
          size: "small" as const,
          // Pre-fills the input with a placeholder. User appends/replaces
          // with the target language and submits via Enter. handleSubmit
          // reads pendingTypeRef and forwards `type: "translate"`. We
          // expand the selection now so the user sees the scope before
          // typing the language — handleSubmit doesn't re-expand.
          onItemClick: () => {
            expandSelectionToBlocks();
            pendingTypeRef.current = "translate";
            setPrompt("Translate to ");
          },
        },
        {
          key: "simplify",
          title: "Simplify",
          aliases: ["simplify", "easier", "plain"],
          icon: <WandSparklesIcon size={18} />,
          size: "small" as const,
          onItemClick: () => {
            expandSelectionToBlocks();
            void ai.invokeAI({
              userPrompt: "simplify",
              useSelection: true,
              chatRequestOptions: { body: { type: "simplify" } },
            });
          },
        },
      ];
    }

    // No selection (the /ai slash menu path): just Generate from Template.
    // Free-form typing still works — once the user types, items hide and
    // Enter submits with no type (backend defaults to fill-template).
    return [generateFromTemplate];
  }, [editor, status, prompt, ai, expandSelectionToBlocks]);

  const handleSubmit = useCallback(
    async (userPrompt: string) => {
      if (!userPrompt.trim()) return;
      const pendingType = pendingTypeRef.current;
      pendingTypeRef.current = null;
      const body = pendingType ? { type: pendingType } : undefined;
      await ai.invokeAI({
        userPrompt,
        useSelection: editor.getSelection() !== undefined,
        ...(body ? { chatRequestOptions: { body } } : {}),
      });
    },
    [ai, editor],
  );

  const placeholder =
    status === "thinking"
      ? dict.ai_menu.status.thinking
      : status === "ai-writing"
        ? dict.ai_menu.status.editing
        : status === "error"
          ? dict.ai_menu.status.error
          : dict.ai_menu.input_placeholder;

  const disabled = status === "thinking" || status === "ai-writing";

  return (
    <PromptSuggestionMenu
      items={items}
      onManualPromptSubmit={handleSubmit}
      promptText={prompt}
      onPromptTextChange={setPrompt}
      placeholder={placeholder}
      disabled={disabled}
      icon={
        <div className="bn-combobox-icon">
          <SparklesIcon size={16} />
        </div>
      }
    />
  );
}

export default function BlockNoteEditor({
  id,
  type,
  initialContent,
  onChange,
  size,
  className,
  markdownContent,
  diffContent,
  placeholder,
  bordered,
  inlineContentSpecs,
  renderOverlays,
  enableMentions,
  disableMentions,
  mentionSearchFn,
  mentionSearchParams,
  mentionResolveFn,
  suggestionMenuComponent,
  mentionNameResolver,
  onWarmMentions,
  aiConfig,
  stretch,
}: BlockNoteEditorProps): React.JSX.Element {
  const t = useTranslations();
  const locale = useI18nLocale();
  const { company } = useCurrentUserContext<UserInterface>();

  const [acceptedChanges, setAcceptedChanges] = useState<Set<string>>(new Set());
  const [rejectedChanges, setRejectedChanges] = useState<Set<string>>(new Set());

  const editorRef = useRef<HTMLDivElement>(null);

  // Ensure side menu buttons don't trigger form submission
  useEffect(() => {
    if (!editorRef.current) return;
    const setButtonTypes = () => {
      editorRef.current?.querySelectorAll(".bn-side-menu button").forEach((btn) => {
        if (!btn.getAttribute("type")) {
          btn.setAttribute("type", "button");
        }
      });
    };
    const observer = new MutationObserver(setButtonTypes);
    observer.observe(editorRef.current, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const handleAcceptChange = useCallback((diffId: string) => {
    setAcceptedChanges((prev) => new Set([...prev, diffId]));
    setRejectedChanges((prev) => {
      const newSet = new Set(prev);
      newSet.delete(diffId);
      return newSet;
    });
  }, []);

  const handleRejectChange = useCallback((diffId: string) => {
    setRejectedChanges((prev) => new Set([...prev, diffId]));
    setAcceptedChanges((prev) => {
      const newSet = new Set(prev);
      newSet.delete(diffId);
      return newSet;
    });
  }, []);

  const DiffActionsInlineContent = useMemo(
    () => createDiffActionsInlineContentSpec(handleAcceptChange, handleRejectChange),
    [handleAcceptChange, handleRejectChange],
  );

  const mentionSpec = useMemo(
    () => createMentionInlineContentSpec(mentionResolveFn, disableMentions, mentionNameResolver),
    [disableMentions, mentionResolveFn, mentionNameResolver],
  );

  const schema = useMemo(
    () =>
      BlockNoteSchema.create({
        inlineContentSpecs: {
          ...defaultInlineContentSpecs,
          diffActions: DiffActionsInlineContent,
          mention: mentionSpec,
          ...inlineContentSpecs,
        },
      } as any),
    [DiffActionsInlineContent, mentionSpec, inlineContentSpecs],
  );

  const docRef = useRef<{ getDoc: () => any[] }>({ getDoc: () => [] });
  // Selection getter used by the AI transport to attach `selectionBlocks` to
  // the outgoing request metadata. Populated in a useEffect once the editor
  // instance exists; reads the current BlockNote selection on every send.
  const selectionRef = useRef<{ getSelectedBlocks: () => any[] }>({ getSelectedBlocks: () => [] });

  const companyId = company?.id;
  const aiExtension = useMemo(() => {
    if (!aiConfig) return undefined;
    const base = getPublicApiUrl();
    const url = new URL(aiConfig.endpoint, base.endsWith("/") ? base : base + "/").toString();
    return AIExtension({
      transport: new DefaultChatTransport({
        api: url,
        credentials: "include",
        headers: async () => {
          const headers: Record<string, string> = { "x-language": locale };
          const token = await getClientToken();
          if (token) headers["Authorization"] = `Bearer ${token}`;
          if (companyId) headers["x-companyid"] = companyId;
          return headers;
        },
        prepareSendMessagesRequest: ({ messages, body }: any) => {
          let lastUserIdx = -1;
          for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i]?.role === "user") {
              lastUserIdx = i;
              break;
            }
          }
          const selectedBlocks = selectionRef.current.getSelectedBlocks();
          const augmented = messages.map((m: any, i: number) =>
            i === lastUserIdx
              ? {
                  ...m,
                  metadata: {
                    ...(m.metadata ?? {}),
                    entityType: aiConfig.entityType,
                    entityId: aiConfig.entityId,
                    blocks: docRef.current.getDoc(),
                    selectionBlocks: selectedBlocks,
                  },
                }
              : m,
          );
          return { body: { ...(body ?? {}), messages: augmented } };
        },
      }),
    });
  }, [aiConfig, companyId, locale]);

  const uploadImage = useCallback(
    async (file: File): Promise<string> => {
      if (!company) {
        errorToast({
          title: t(`common.errors.upload`),
          error: t(`common.errors.upload_description`),
        });
        throw new Error(t(`common.errors.upload`));
      }

      const fileType = file.type;
      const key = `companies/${company.id}/${type}/${id}/${file.name}`;

      const s3: S3Interface = await S3Service.getPreSignedUrl({
        key: key,
        contentType: fileType,
        isPublic: true,
      });

      await fetch(s3.url, {
        method: "PUT",
        headers: s3.headers,
        body: file,
      });

      const signedImage: S3Interface = await S3Service.getSignedUrl({
        key: key,
        isPublic: true,
      });

      return signedImage.url;
    },
    [company, id, t],
  );

  // Utility: Remove trailing empty blocks for read-only display
  const removeTrailingEmptyBlocks = useCallback(
    (blocks: PartialBlock[]): PartialBlock[] => {
      if (!blocks || blocks.length === 0) return blocks;

      // Only remove trailing empty blocks in read-only mode
      if (onChange !== undefined) return blocks;

      const result = [...blocks];

      // Remove trailing empty paragraph blocks, but keep at least one block
      while (result.length > 1) {
        const lastBlock = result[result.length - 1];

        // Check if it's an empty paragraph
        const isEmptyParagraph =
          lastBlock.type === "paragraph" &&
          (!lastBlock.content ||
            lastBlock.content.length === 0 ||
            (Array.isArray(lastBlock.content) && lastBlock.content.every((c: any) => !c.text || c.text.trim() === "")));

        if (isEmptyParagraph) {
          result.pop();
        } else {
          break;
        }
      }

      return result;
    },
    [onChange],
  );

  const processedContent = useMemo(() => {
    if (diffContent && initialContent) {
      try {
        const diffResult = BlockNoteDiffUtil.diff(initialContent, diffContent);
        const renderedDiff = BlockNoteWordDiffRendererUtil.renderWordDiffs(
          diffResult.blocks,
          handleAcceptChange,
          handleRejectChange,
          acceptedChanges,
          rejectedChanges,
        );
        return removeTrailingEmptyBlocks(renderedDiff);
      } catch (_error) {
        return initialContent && Array.isArray(initialContent) && initialContent.length > 0
          ? removeTrailingEmptyBlocks(initialContent)
          : [];
      }
    }

    if (!initialContent) {
      return [];
    }

    if (!Array.isArray(initialContent)) {
      return [];
    }

    return initialContent.length > 0 ? removeTrailingEmptyBlocks(initialContent) : [];
  }, [
    initialContent,
    diffContent,
    handleAcceptChange,
    handleRejectChange,
    acceptedChanges,
    rejectedChanges,
    removeTrailingEmptyBlocks,
  ]);

  const validatedInitialContent = useMemo(() => {
    if (processedContent && Array.isArray(processedContent) && processedContent.length > 0) {
      const validatedContent = processedContent.filter((block) => {
        if (!block || typeof block !== "object") return false;
        if (!(block as any).type) return false;
        return true;
      });
      return validatedContent.length > 0 ? (validatedContent as PartialBlock[]) : undefined;
    }
    return undefined;
  }, [processedContent]);

  const editor = useCreateBlockNote(
    useMemo(
      () => ({
        placeholders: {
          emptyDocument: placeholder || t(`common.blocknote.placeholder`),
        },
        schema,
        initialContent: validatedInitialContent,
        uploadFile: uploadImage,
        extensions: aiExtension ? [aiExtension] : undefined,
        dictionary: aiExtension ? { ...coreEn, ai: aiEn } : undefined,
      }),
      [placeholder, t, schema, validatedInitialContent, uploadImage, aiExtension],
    ),
  );

  // Tracks the hash of the document the editor itself just emitted via onChange.
  // The sync effect below uses it to skip replaceBlocks when the parent's
  // initialContent is just an echo of our own emission (form-controlled flow).
  const lastEmittedHashRef = useRef<string | null>(null);

  const handleChange = useCallback(async () => {
    if (!onChange) return;
    const newBlocks = editor.document;
    lastEmittedHashRef.current = JSON.stringify(newBlocks);
    const isEmpty = isDocumentEmpty(newBlocks);

    function hasUnresolvedDiffsRecursive(block: any): boolean {
      if (!block || typeof block !== "object") return false;
      let diffId = undefined;
      if (block.props && block.props.diffId) diffId = block.props.diffId;
      if (!diffId && block.attrs && block.attrs.diffId) diffId = block.attrs.diffId;
      if (diffId && !acceptedChanges.has(diffId) && !rejectedChanges.has(diffId)) {
        return true;
      }

      if (block.content) {
        const contentArr = Array.isArray(block.content) ? block.content : [block.content];
        for (const inline of contentArr) {
          if (inline && typeof inline === "object") {
            if (inline.type === "diffActions" && inline.props && inline.props.diffIds) {
              const ids =
                typeof inline.props.diffIds === "string" ? inline.props.diffIds.split(",") : inline.props.diffIds;
              for (const id of ids) {
                const trimmed = (id || "").toString().trim();
                if (trimmed && !acceptedChanges.has(trimmed) && !rejectedChanges.has(trimmed)) {
                  return true;
                }
              }
            }
            if (inline.props && inline.props.diffId) {
              const diffIdInline = inline.props.diffId;
              if (diffIdInline && !acceptedChanges.has(diffIdInline) && !rejectedChanges.has(diffIdInline)) {
                return true;
              }
            }
            if (inline.children && Array.isArray(inline.children)) {
              for (const child of inline.children) {
                if (hasUnresolvedDiffsRecursive(child)) return true;
              }
            }
          }
        }
      }
      if (Array.isArray(block.children)) {
        for (const child of block.children) {
          if (hasUnresolvedDiffsRecursive(child)) return true;
        }
      }
      return false;
    }

    let hasUnresolvedDiff = false;
    if (Array.isArray(newBlocks)) {
      hasUnresolvedDiff = newBlocks.some((block: any) => hasUnresolvedDiffsRecursive(block));
    }

    onChange(newBlocks, isEmpty, hasUnresolvedDiff);
  }, [editor, onChange, id, acceptedChanges, rejectedChanges]);

  // Utility: deep equality for arrays of blocks
  const areBlocksEqual = (a: any[], b: any[]): boolean => {
    return JSON.stringify(a) === JSON.stringify(b);
  };

  // Only initialize from markdownContent once per value, and only if different
  const hasInitializedFromMarkdown = useRef<string | null>(null);
  useEffect(() => {
    const updateContent = async (markdown: string) => {
      const blocks = await editor.tryParseMarkdownToBlocks(markdown);
      if (!areBlocksEqual(blocks, editor.document)) {
        editor.replaceBlocks(editor.document, blocks);
      }
    };

    if (markdownContent && hasInitializedFromMarkdown.current !== markdownContent) {
      hasInitializedFromMarkdown.current = markdownContent;
      updateContent(markdownContent).then(() => handleChange());
    }
  }, [markdownContent, editor]);

  // Update editor content when diff content changes, but only if different
  // Prevent unnecessary replaceBlocks calls that reset scroll/cursor.
  const previousContentHashRef = useRef<string | null>(null);
  useEffect(() => {
    if (!processedContent || !editor) return;
    const hash = JSON.stringify(processedContent);
    if (previousContentHashRef.current === hash) return; // no changes
    // Skip replaceBlocks when the new initialContent is just an echo of what
    // the editor itself emitted. Without this, a form-controlled parent
    // (FormBlockNote) round-trips field.value back as initialContent on every
    // keystroke and triggers replaceBlocks, which resets the cursor and can
    // strip just-inserted inline content like mentions.
    if (lastEmittedHashRef.current === hash) {
      previousContentHashRef.current = hash;
      return;
    }
    const currentHash = JSON.stringify(editor.document);
    if (currentHash === hash) {
      previousContentHashRef.current = hash;
      return; // already in sync
    }
    editor.replaceBlocks(editor.document, processedContent as PartialBlock[]);
    previousContentHashRef.current = hash;
  }, [processedContent, editor]);

  useEffect(() => {
    if (!onWarmMentions || !initialContent || !Array.isArray(initialContent) || initialContent.length === 0) return;
    onWarmMentions(initialContent);
  }, [onWarmMentions, initialContent]);

  useEffect(() => {
    docRef.current.getDoc = () => editor?.document ?? [];
    selectionRef.current.getSelectedBlocks = () => {
      const sel = editor?.getSelection?.();
      const blocks = (sel as any)?.blocks;
      return Array.isArray(blocks) ? blocks : [];
    };
  }, [editor]);

  // Handle audio received from whisper transcription
  const _handleAudioReceived = useCallback(
    (message: string) => {
      try {
        // Ensure the editor has focus
        const editorElement = editorRef.current?.querySelector('[contenteditable="true"]') as HTMLElement;
        if (editorElement && document.activeElement !== editorElement) {
          editorElement.focus();
        }

        // Insert the transcribed text at the current cursor position
        editor.insertInlineContent(message);
      } catch (error) {
        console.error("Error inserting transcribed text:", error);
        // Fallback: try to insert at the end of the document
        try {
          const blocks = editor.document;
          if (blocks.length > 0) {
            const lastBlock = blocks[blocks.length - 1];
            editor.setTextCursorPosition(lastBlock.id, "end");
            editor.insertInlineContent(message);
          }
        } catch (fallbackError) {
          console.error("Fallback insertion also failed:", fallbackError);
        }
      }
    },
    [editor],
  );

  return (
    <div
      ref={editorRef}
      className={cn(
        bordered ? "rounded-md border border-input bg-input/20 dark:bg-input/30" : "",
        "flex flex-col w-full",
        // Pin BlockNote's font-size so it doesn't jump from 14→16px when the
        // xl-ai AIMenu mounts. The shadcn theme sets `.bn-default-styles {
        // font-size: 16px }` explicitly; outside AI mode the form's text-sm
        // wins via cascade, but ForkYDocExtension re-evaluates the style
        // context on AI activation and the explicit 16px takes over.
        "[&_.bn-default-styles]:!text-sm",
        className,
      )}
    >
      <BlockNoteView
        editor={editor}
        onChange={handleChange}
        editable={onChange !== undefined}
        formattingToolbar={false}
        slashMenu={!aiConfig}
        theme="light"
        // `className` is applied by BlockNote to both the main `.bn-container`
        // AND `editor.portalElement` (the floating-UI portal root). Gate `p-4`
        // on `.bn-container` so it doesn't add padding to the empty portal
        // element and produce a phantom scrollbar on the wrapper.
        className={cn(
          "BlockNoteView flex-1",
          onChange && "[&.bn-container]:p-4",
          // In stretch mode the parent chain caps our height via flex; without
          // these two classes the `.bn-container` keeps `min-height: auto`
          // (its content's intrinsic height) and pushes the bordered wrapper
          // — and the surrounding EditorSheet form — to scroll instead of
          // scrolling internally.
          onChange && stretch && "[&.bn-container]:min-h-0 [&.bn-container]:overflow-y-auto",
          size === "sm" && "small",
        )}
      >
        <BlockNoteEditorFormattingToolbar showAI={!!aiConfig} />
        {enableMentions && mentionSearchFn && (
          <BlockNoteEditorMentionSuggestionMenu
            editor={editor}
            mentionSearchFn={mentionSearchFn}
            mentionSearchParams={mentionSearchParams}
            suggestionMenuComponent={suggestionMenuComponent}
          />
        )}
        {renderOverlays?.(editor)}
        {enableMentions && mentionResolveFn && (
          <BlockNoteEditorMentionHoverCard containerRef={editorRef} mentionResolveFn={mentionResolveFn} />
        )}
        {aiConfig && (
          <SuggestionMenuController
            triggerCharacter="/"
            getItems={async (query: string) =>
              filterSuggestionItems([...getDefaultReactSlashMenuItems(editor), ...getAISlashMenuItems(editor)], query)
            }
          />
        )}
        {aiConfig && <AIMenuController aiMenu={() => <NarrAIMenu />} />}
      </BlockNoteView>
    </div>
  );
}
