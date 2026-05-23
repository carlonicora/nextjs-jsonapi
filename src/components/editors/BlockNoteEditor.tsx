"use client";

import { BlockNoteSchema, defaultInlineContentSpecs, filterSuggestionItems, PartialBlock } from "@blocknote/core";
import { en as coreEn } from "@blocknote/core/locales";
import {
  createReactInlineContentSpec,
  DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  SuggestionMenuProps,
  useCreateBlockNote,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import { AIExtension, AIMenu, AIMenuController, getAISlashMenuItems, getDefaultAIMenuItems } from "@blocknote/xl-ai";
import { en as aiEn } from "@blocknote/xl-ai/locales";
import "@blocknote/xl-ai/style.css";
import { DefaultChatTransport } from "ai";
import { CheckIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCurrentUserContext } from "../../contexts";
import { S3Interface } from "../../features/s3/data";
import { S3Service } from "../../features/s3/data/s3.service";
import { UserInterface } from "../../features/user/data";
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
import { getPublicApiUrl } from "../../client/config";
import { getClientToken } from "../../client/token";
import { useI18nLocale } from "../../i18n/config";

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
          const augmented = messages.map((m: any, i: number) =>
            i === lastUserIdx
              ? {
                  ...m,
                  metadata: {
                    ...(m.metadata ?? {}),
                    entityType: aiConfig.entityType,
                    entityId: aiConfig.entityId,
                    blocks: docRef.current.getDoc(),
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
        {aiConfig && (
          <AIMenuController
            aiMenu={() => (
              <AIMenu
                items={(editor, status) => (status === "user-input" ? [] : getDefaultAIMenuItems(editor, status))}
              />
            )}
          />
        )}
      </BlockNoteView>
    </div>
  );
}
