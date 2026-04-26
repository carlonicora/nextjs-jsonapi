"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ApiDataInterface } from "../../../../../core";
import { ModuleRegistry } from "../../../../../core/registry/ModuleRegistry";
import { usePageUrlGenerator } from "../../../../../hooks";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../shadcnui/ui/table";

interface Props {
  references: ApiDataInterface[];
}

export function ReferencesTab({ references }: Props) {
  const t = useTranslations();
  const generate = usePageUrlGenerator();

  if (references.length === 0) return null;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("features.assistant.message.sources.source")}</TableHead>
          <TableHead className="w-32">{t("features.assistant.message.sources.type")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {references.map((ref) => {
          let module;
          try {
            module = ModuleRegistry.findByName(ref.type);
          } catch {
            return null;
          }
          const href = generate({ page: module, id: ref.id });
          return (
            <TableRow key={`${ref.type}/${ref.id}`}>
              <TableCell>
                <Link href={href} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                  {ref.identifier}
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
