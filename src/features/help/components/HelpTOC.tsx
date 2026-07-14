"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { HelpHeading } from "../types/help-article.types";
import { MicroLabel } from "../../../components/typography";

export function HelpTOC({ headings }: { headings: readonly HelpHeading[] }) {
  const t = useTranslations();
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.slug);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;
  return (
    <nav aria-label={t("help.toc.title")} className="hidden lg:block">
      <MicroLabel className="mb-2">{t("help.toc.title")}</MicroLabel>
      <ul className="space-y-1 text-sm">
        {headings.map((h) => (
          <li key={h.slug} style={{ paddingLeft: `${(h.depth - 2) * 0.75}rem` }}>
            <a
              href={`#${h.slug}`}
              className={
                "block truncate hover:text-foreground " +
                (active === h.slug ? "text-foreground font-medium" : "text-muted-foreground")
              }
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
