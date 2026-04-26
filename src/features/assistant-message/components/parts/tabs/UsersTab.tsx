"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ApiDataInterface } from "../../../../../core";
import { ModuleRegistry } from "../../../../../core/registry/ModuleRegistry";
import { usePageUrlGenerator } from "../../../../../hooks";
import type { ChunkInterface, ChunkRelationshipMeta } from "../../../../chunk/data/ChunkInterface";
import { Avatar, AvatarFallback, AvatarImage } from "../../../../../shadcnui/ui/avatar";
import { Table, TableBody, TableCell, TableRow } from "../../../../../shadcnui/ui/table";

interface Props {
  /** Pre-deduplicated list of authors derived from the resolved sources. */
  users: ApiDataInterface[];
  /**
   * Optional citations + sources used to compute per-user content/citation
   * counts. When omitted, only the user list is shown.
   */
  citations?: (ChunkInterface & ChunkRelationshipMeta)[];
  sources?: Map<string, ApiDataInterface>;
}

interface UserRow {
  user: ApiDataInterface;
  contentCount: number;
  citationCount: number;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function readAuthor(source: ApiDataInterface): ApiDataInterface | undefined {
  // The Content base class throws on missing author. Catch defensively so a
  // partially-hydrated source never breaks the UI.
  try {
    const a = (source as any).author;
    return a && a.id ? a : undefined;
  } catch {
    return undefined;
  }
}

export function UsersTab({ users, citations, sources }: Props) {
  const t = useTranslations();
  const generate = usePageUrlGenerator();

  // Build per-user counts. If we have citations + sources, compute real counts.
  // Otherwise fall back to one row per user with no counts.
  const userMap = new Map<string, UserRow>();
  for (const u of users) {
    if (!u?.id) continue;
    userMap.set(u.id, { user: u, contentCount: 0, citationCount: 0 });
  }

  if (citations && sources) {
    const sourceUserPairs = new Set<string>();
    for (const c of citations) {
      const id = c.nodeId;
      if (!id) continue;
      const source = sources.get(id);
      if (!source) continue;
      const author = readAuthor(source);
      if (!author) continue;

      let row = userMap.get(author.id);
      if (!row) {
        row = { user: author, contentCount: 0, citationCount: 0 };
        userMap.set(author.id, row);
      }
      const sourceUserKey = `${source.id}:${author.id}`;
      if (!sourceUserPairs.has(sourceUserKey)) {
        sourceUserPairs.add(sourceUserKey);
        row.contentCount++;
      }
      row.citationCount++;
    }
  }

  const rows = Array.from(userMap.values()).sort(
    (a, b) =>
      b.citationCount - a.citationCount || ((a.user as any).name ?? "").localeCompare((b.user as any).name ?? ""),
  );

  if (rows.length === 0) return null;

  return (
    <Table>
      <TableBody>
        {rows.map(({ user, contentCount, citationCount }) => {
          let module;
          try {
            module = ModuleRegistry.findByName(user.type);
          } catch {
            return null;
          }
          const href = generate({ page: module, id: user.id });
          const name = (user as any).name ?? (user as any).fullName ?? user.identifier ?? "User";
          const avatarUrl = (user as any).avatar as string | undefined;
          const showCounts = citationCount > 0 || contentCount > 0;
          return (
            <TableRow key={user.id}>
              <TableCell>
                <Link
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:underline"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={avatarUrl} aria-label={name} />
                    <AvatarFallback aria-label={name}>{getInitials(name)}</AvatarFallback>
                  </Avatar>
                  <span className="flex flex-col">
                    <span className="font-medium">{name}</span>
                    {showCounts && (
                      <span className="text-muted-foreground text-xs">
                        {t("features.assistant.message.sources.contents_count", {
                          count: contentCount,
                        })}
                        {" · "}
                        {t("features.assistant.message.sources.citations_count", {
                          count: citationCount,
                        })}
                      </span>
                    )}
                  </span>
                </Link>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
