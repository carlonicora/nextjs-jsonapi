"use client";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { HelpCircleIcon } from "lucide-react";
import {
  Button,
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../../../shadcnui";
import { usePageUrlGenerator } from "../../../client";
import { HowToService } from "../../how-to/data/HowToService";
import type { HowToInterface } from "../../how-to/data/HowToInterface";

export function HelpHint({ contextKey }: { contextKey: string }) {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<HowToInterface | null>(null);

  const [articles, setArticles] = useState<HowToInterface[]>([]);
  useEffect(() => {
    let active = true;
    HowToService.findPublished()
      .then((list) => active && setArticles(list))
      .catch(() => active && setArticles([]));
    return () => {
      active = false;
    };
  }, []);

  const matches = useMemo(
    () => articles.filter((a) => a.contextualKeys.includes(contextKey) && !a.draft),
    [articles, contextKey],
  );

  if (matches.length === 0) return null;
  const active = picked ?? (matches.length === 1 ? matches[0] : null);

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setPicked(null);
      }}
    >
      <SheetTrigger render={<Button variant="ghost" size="icon-sm" aria-label={t("help.hint.trigger")} />}>
        <HelpCircleIcon className="h-4 w-4" />
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-md sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{active ? active.name : t("help.hint.pickArticle")}</SheetTitle>
          <SheetDescription>{active?.summary ?? ""}</SheetDescription>
        </SheetHeader>
        {active ? (
          <div className="mt-4 space-y-3">
            <p className="text-muted-foreground text-sm">{active.summary}</p>
            <Link href={generateUrl({ page: `/help/${active.howToType}/${active.slug}` })} className="text-sm">
              {t("help.hint.viewArticle")}
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-1">
            {matches.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setPicked(a)}
                  className="hover:bg-muted block w-full rounded px-2 py-1 text-left text-sm"
                >
                  <div className="font-medium">{a.name}</div>
                  <div className="text-muted-foreground text-xs">{a.summary}</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
