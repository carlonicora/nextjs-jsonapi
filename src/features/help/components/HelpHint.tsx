"use client";
import { useMemo, useState } from "react";
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
import { useHelp } from "../contexts/HelpContext";
import { articleUrl } from "../utils/articleUrl";
import type { HelpArticle } from "../types/help-article.types";

export function HelpHint({ contextKey }: { contextKey: string }) {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();
  const { manifest } = useHelp();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<HelpArticle | null>(null);

  const matches = useMemo(
    () => manifest.filter((a) => a.contextualKeys.includes(contextKey) && !a.draft),
    [manifest, contextKey],
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
          <SheetTitle>{active ? active.title : t("help.hint.pickArticle")}</SheetTitle>
          <SheetDescription>{active?.summary ?? ""}</SheetDescription>
        </SheetHeader>
        {active ? (
          <div className="mt-4 space-y-3">
            <p className="text-muted-foreground text-sm">{active.summary}</p>
            <Link href={articleUrl(generateUrl, active)} className="text-sm">
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
                  <div className="font-medium">{a.title}</div>
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
