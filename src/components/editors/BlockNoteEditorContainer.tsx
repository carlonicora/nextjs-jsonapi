"use client";

import dynamic from "next/dynamic";
import React from "react";
import { BlockNoteEditorProps } from "./BlockNoteEditor";

const BlockNoteEditor = dynamic(() => import("./BlockNoteEditor"), {
  ssr: false,
});

export const BlockNoteEditorContainer = React.memo(function EditorContainer(props: BlockNoteEditorProps) {
  return <BlockNoteEditor {...props} />;
});
