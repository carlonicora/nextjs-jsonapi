"use client";

import type { MentionResolveFn } from "./BlockNoteEditorMentionInlineContent";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type HoveredMention = {
  id: string;
  entityType: string;
  alias: string;
  element: HTMLElement;
};

export function BlockNoteEditorMentionHoverCard({
  containerRef,
  mentionResolveFn,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  mentionResolveFn?: MentionResolveFn;
}) {
  const [hovered, setHovered] = useState<HoveredMention | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleClose = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => setHovered(null), 200);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !mentionResolveFn) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("[data-mention-id]") as HTMLElement | null;
      if (!target) return;

      cancelClose();

      const id = target.dataset.mentionId!;
      const entityType = target.dataset.mentionType!;
      const alias = target.dataset.mentionAlias!;

      setHovered((prev) => {
        if (prev?.id === id && prev?.element === target) return prev;
        return { id, entityType, alias, element: target };
      });
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("[data-mention-id]");
      if (!target) return;

      const related = (e.relatedTarget as HTMLElement)?.closest("[data-mention-id]");
      if (related) return;

      scheduleClose();
    };

    container.addEventListener("mouseover", handleMouseOver);
    container.addEventListener("mouseout", handleMouseOut);

    return () => {
      container.removeEventListener("mouseover", handleMouseOver);
      container.removeEventListener("mouseout", handleMouseOut);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, [containerRef, mentionResolveFn, cancelClose, scheduleClose]);

  if (!hovered || !mentionResolveFn) return null;

  const resolved = mentionResolveFn(hovered.id, hovered.entityType, hovered.alias);
  if (!resolved?.HoverCardContent) return null;

  const ContentComponent = resolved.HoverCardContent;
  const rect = hovered.element.getBoundingClientRect();

  return createPortal(
    <div
      onMouseEnter={cancelClose}
      onMouseLeave={scheduleClose}
      style={{
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        zIndex: 50,
      }}
      className="bg-popover text-popover-foreground rounded-lg border p-2.5 text-xs shadow-md animate-in fade-in-0 zoom-in-95 duration-100"
    >
      <ContentComponent id={hovered.id} entityType={hovered.entityType} alias={hovered.alias} />
    </div>,
    document.body,
  );
}
