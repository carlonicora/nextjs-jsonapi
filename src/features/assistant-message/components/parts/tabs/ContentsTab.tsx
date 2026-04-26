"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ApiDataInterface } from "../../../../../core";
import { ModuleRegistry } from "../../../../../core/registry/ModuleRegistry";
import { usePageUrlGenerator } from "../../../../../hooks";
import type { ChunkInterface, ChunkRelationshipMeta } from "../../../../chunk/data/ChunkInterface";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../shadcnui/ui/table";

interface Props {
  citations: (ChunkInterface & ChunkRelationshipMeta)[];
  /** Resolved source entities keyed by `chunk.nodeId`. */
  sources?: Map<string, ApiDataInterface>;
}

interface ContentRow {
  source: ApiDataInterface;
  citationCount: number;
  maxRelevance: number;
}

export function ContentsTab({ citations, sources }: Props) {
  const t = useTranslations();
  const generate = usePageUrlGenerator();

  // Group citations by nodeId, then materialise rows from the resolved sources
  // map. Chunks without a resolved source entity are skipped.
  const map = new Map<string, ContentRow>();
  for (const c of citations) {
    const id = c.nodeId;
    if (!id) continue;
    const source = sources?.get(id);
    if (!source) continue;
    const existing = map.get(id);
    if (existing) {
      existing.citationCount++;
      existing.maxRelevance = Math.max(existing.maxRelevance, c.relevance ?? 0);
    } else {
      map.set(id, { source, citationCount: 1, maxRelevance: c.relevance ?? 0 });
    }
  }

  const rows = Array.from(map.values()).sort(
    (a, b) =>
      b.maxRelevance - a.maxRelevance || ((a.source as any).name ?? "").localeCompare((b.source as any).name ?? ""),
  );

  if (rows.length === 0) return null;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("features.assistant.message.sources.source")}</TableHead>
          <TableHead className="w-32">{t("features.assistant.message.sources.type")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(({ source, citationCount }) => {
          let module;
          try {
            module = ModuleRegistry.findByName(source.type);
          } catch {
            return null;
          }
          const href = generate({ page: module, id: source.id });
          const name = (source as any).name ?? source.identifier;
          return (
            <TableRow key={`${source.type}/${source.id}`}>
              <TableCell>
                <Link href={href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  <span className="font-medium">{name}</span>{" "}
                  <span className="text-muted-foreground text-xs">
                    {t("features.assistant.message.sources.citations_count", {
                      count: citationCount,
                    })}
                  </span>
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">{module.name}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
