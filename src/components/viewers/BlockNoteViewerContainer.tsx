"use client";

import dynamic from "next/dynamic";
import React from "react";

const BlockNoteViewer = dynamic(() => import("./BlockNoteViewer").then((m) => m.BlockNoteViewer), { ssr: false });

export const BlockNoteViewerContainer = React.memo(function ViewerContainer(props: { content: unknown }) {
  return <BlockNoteViewer {...props} />;
});
