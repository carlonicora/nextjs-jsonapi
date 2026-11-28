"use client";

import React, { useEffect, useState } from "react";
import type { BlockNoteEditorProps } from "./BlockNoteEditor";
import { BlockNoteEditorPlaceholder } from "./BlockNoteEditorPlaceholder";

type EditorComponent = React.ComponentType<BlockNoteEditorProps>;

// The editor code loads once, on demand, for every field (as next/dynamic with ssr: false did).
let loadedEditor: EditorComponent | null = null;
let editorLoad: Promise<EditorComponent> | null = null;

function loadEditor(): Promise<EditorComponent> {
  editorLoad ??= import("./BlockNoteEditor").then((module) => {
    loadedEditor = module.default;
    return module.default;
  });
  return editorLoad;
}

/**
 * Until the editor code arrives (and on the server) the field shows its text in a placeholder of
 * about the same size, so the page does not grow and shift under the reader when the editor mounts.
 */
export const BlockNoteEditorContainer = React.memo(function EditorContainer(props: BlockNoteEditorProps) {
  // Always the placeholder first: the server renders it, so the first client render must match it
  // (hydration); once the code is loaded the editor replaces it on mount.
  const [Editor, setEditor] = useState<EditorComponent | null>(null);

  useEffect(() => {
    if (Editor) return;
    if (loadedEditor) {
      setEditor(() => loadedEditor);
      return;
    }
    let active = true;
    void loadEditor().then((component) => {
      if (active) setEditor(() => component);
    });
    return () => {
      active = false;
    };
  }, [Editor]);

  if (!Editor) return <BlockNoteEditorPlaceholder {...props} />;
  return <Editor {...props} />;
});
