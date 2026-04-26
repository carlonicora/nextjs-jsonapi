"use client";

import { Fragment, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, HelpCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ApiDataInterface } from "../../../../../core";
import type { ChunkInterface, ChunkRelationshipMeta } from "../../../../chunk/data/ChunkInterface";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../shadcnui/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../../../shadcnui/ui/tooltip";
import { cn } from "@/lib/utils";
import { RelevanceMeter } from "../RelevanceMeter";

interface Props {
  citations: (ChunkInterface & ChunkRelationshipMeta)[];
  /**
   * Resolved source entities keyed by `chunk.nodeId`. When provided, the row
   * label is the entity's `name`; otherwise it falls back to the nodeType + a
   * short id.
   */
  sources?: Map<string, ApiDataInterface>;
}

export function CitationsTab({ citations, sources }: Props) {
  const t = useTranslations();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  if (citations.length === 0) return null;

  const sorted = [...citations].sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0));

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead>{t("features.assistant.message.sources.source")}</TableHead>
          <TableHead className="w-28 text-center">{t("features.assistant.message.sources.relevance")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((chunk) => {
          const isOpen = expanded.has(chunk.id);
          const resolved = chunk.nodeId ? sources?.get(chunk.nodeId) : undefined;
          const fallbackName = chunk.nodeId
            ? `${chunk.nodeType ?? t("features.assistant.message.sources.source")} ${chunk.nodeId.slice(0, 8)}`
            : (chunk.nodeType ?? t("features.assistant.message.sources.source"));
          const sourceName = (resolved as any)?.name ?? fallbackName;
          return (
            <Fragment key={chunk.id}>
              <TableRow>
                <TableCell>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggle(chunk.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggle(chunk.id);
                      }
                    }}
                    aria-expanded={isOpen}
                    className="flex w-full cursor-pointer items-center justify-start gap-x-2"
                  >
                    <ChevronDown className={cn("h-4 w-4 transition-transform", !isOpen && "-rotate-90")} />
                    <span className="font-semibold">{sourceName}</span>
                    {chunk.reason && (
                      <Tooltip>
                        <TooltipTrigger className="text-muted-foreground inline-flex">
                          <HelpCircle className="h-3.5 w-3.5" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-64 text-xs">{chunk.reason}</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <RelevanceMeter value={chunk.relevance ?? 0} />
                </TableCell>
              </TableRow>
              {isOpen && (
                <TableRow>
                  <TableCell colSpan={2} className="border-t-0 p-4">
                    <div className="bg-card w-full max-w-full overflow-x-auto rounded border p-4 text-sm break-words">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{chunk.content}</ReactMarkdown>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}
