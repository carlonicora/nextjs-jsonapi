"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "../../utils";

/**
 * Shows HTML produced by BlockNoteServerContent inside the same container
 * markup BlockNoteView renders, so BlockNote's stylesheet and the app's
 * `.BlockNoteView` rules apply as they do to BlockNoteViewer.
 */
export function BlockNoteStaticViewer({
  html,
  size,
  className,
}: {
  html: string;
  size?: "default" | "sm";
  className?: string;
}) {
  // The server cannot know the theme: render light until mounted, then follow
  // the app theme like BlockNoteViewer, so hydration never mismatches.
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const theme = mounted && resolvedTheme === "dark" ? "dark" : "light";

  return (
    <div
      className={cn("bn-root bn-container", theme, "bn-shadcn BlockNoteView", size === "sm" && "small", className)}
      data-color-scheme={theme}
    >
      <div
        className="bn-editor bn-default-styles ProseMirror"
        contentEditable={false}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
