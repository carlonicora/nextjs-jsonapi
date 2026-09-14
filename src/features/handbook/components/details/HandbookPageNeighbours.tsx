"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { MicroLabel } from "../../../../components";
import { Modules } from "../../../../core";
import { usePageUrlGenerator } from "../../../../hooks";
import { Link } from "../../../../shadcnui";
import { handbookPageTitle } from "../../data/handbookDisplay";
import { HandbookPageInterface } from "../../data/HandbookPageInterface";

type HandbookPageNeighboursProps = {
  pages: HandbookPageInterface[];
  currentId: string;
};

/**
 * Previous and next, at the foot of the page.
 *
 * Walks the same ordering the navigator renders — section key, then `order`,
 * which is the repo-relative path — so reading straight through the manual with
 * these two links reproduces the contents page from top to bottom. Below `md`
 * the navigator is hidden and this pair is the only way forward that is not the
 * breadcrumb.
 *
 * Nothing renders at either end of the list: no disabled control, no empty slot.
 *
 * The ordering is read off `section` and `order`, which stay English; only the
 * two labels are translated.
 */
export function HandbookPageNeighbours({ pages, currentId }: HandbookPageNeighboursProps) {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();

  const { previous, next } = useMemo(() => {
    const ordered = [...pages].sort((a, b) =>
      `${a.section ?? ""}/${a.order ?? ""}`.localeCompare(`${b.section ?? ""}/${b.order ?? ""}`),
    );
    const index = ordered.findIndex((page) => page.id === currentId);
    if (index === -1) return { previous: undefined, next: undefined };

    return { previous: ordered[index - 1], next: ordered[index + 1] };
  }, [pages, currentId]);

  if (!previous && !next) return null;

  return (
    <div className="mt-8 grid gap-4 border-t pt-4 md:grid-cols-2">
      {previous ? (
        <Link
          href={generateUrl({ page: Modules.HandbookPage, id: previous.id })}
          className="flex flex-col gap-y-1 text-start"
        >
          <MicroLabel>{t("handbook.reader.previous")}</MicroLabel>
          <span className="text-primary text-sm font-medium">{handbookPageTitle(previous)}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={generateUrl({ page: Modules.HandbookPage, id: next.id })}
          className="flex flex-col gap-y-1 text-end md:items-end"
        >
          <MicroLabel>{t("handbook.reader.next")}</MicroLabel>
          <span className="text-primary text-sm font-medium">{handbookPageTitle(next)}</span>
        </Link>
      ) : null}
    </div>
  );
}
