"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ApiDataInterface } from "../../../../core";
import { usePageUrlGenerator } from "../../../../hooks";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";

interface Props {
  references: ApiDataInterface[];
}

export function ReferenceBadges({ references }: Props) {
  const t = useTranslations();
  const generate = usePageUrlGenerator();

  if (references.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-xs">
        {t("features.assistant.references_label")}
      </span>
      {references.map((ref) => {
        // ref.type is the JSON:API type string (same as module.name)
        let module;
        try {
          module = ModuleRegistry.findByName(ref.type);
        } catch {
          return null;
        }
        const href = generate({ page: module, id: ref.id });
        return (
          <Link
            key={`${ref.type}/${ref.id}`}
            href={href}
            className="bg-background border-border text-foreground hover:bg-accent inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs"
          >
            <span className="text-muted-foreground text-[10px]">{module.name}</span>
            <span className="font-medium">{ref.identifier}</span>
          </Link>
        );
      })}
    </div>
  );
}
