"use client";

import { LoaderCircleIcon, RotateCcwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { errorToast } from "../../../../components";
import { useI18nLocale } from "../../../../i18n";
import { Badge, Button } from "../../../../shadcnui";
import { BlogCategoryInterface } from "../../data";
import { BlogAiStatus } from "../../types/blog.constants";

/** Status pill colours for a post, shared by the post header and the admin posts table. */
export const BLOG_STATUS_BADGE = {
  draft: "softGray",
  published: "softGreen",
  unpublished: "softAmber",
} as const;

/** The category label in the admin: the category's own original-language name. */
export function blogCategoryAdminName(category: BlogCategoryInterface): string {
  return category.original?.name ?? category.name ?? "";
}

/**
 * Language names come from `Intl.DisplayNames` in the viewer's locale: there is
 * no per-language message key. An unknown code falls back to the code itself.
 */
export function useBlogLanguageName(): (language: string) => string {
  const locale = useI18nLocale();
  const names = useMemo(() => {
    try {
      return new Intl.DisplayNames([locale], { type: "language" });
    } catch {
      return undefined;
    }
  }, [locale]);

  return useCallback(
    (language: string) => {
      const name = names?.of(language);
      if (!name) return language;
      return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
    },
    [names, locale],
  );
}

/** Formats a date for the admin pages in the viewer's locale. */
export function useBlogDateFormatter(): (date?: Date) => string {
  const locale = useI18nLocale();
  return useCallback((date?: Date) => (date ? date.toLocaleDateString(locale, { dateStyle: "medium" }) : ""), [locale]);
}

type BlogTranslationStatusProps = {
  aiStatus: BlogAiStatus;
  /** Re-queues the translation of this one language. Shown only when the job failed. */
  onRetranslate?: () => Promise<void>;
};

/**
 * The translation state of one language. Nothing is rendered once the
 * translation is `completed`; `failed` adds the "Translate again" action.
 */
export function BlogTranslationStatus({ aiStatus, onRetranslate }: BlogTranslationStatusProps) {
  const t = useTranslations();
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  if (aiStatus === "completed") return null;

  if (aiStatus === "pending" || aiStatus === "in_progress") {
    return (
      <div className="flex items-center gap-x-2">
        <Badge variant="softBlue">
          <LoaderCircleIcon className="animate-spin" />
          {aiStatus === "pending" ? t("blog.translation.pending") : t("blog.translation.translating")}
        </Badge>
      </div>
    );
  }

  const retranslate = async () => {
    if (!onRetranslate) return;
    setIsRetrying(true);
    try {
      await onRetranslate();
    } catch (error) {
      errorToast({ title: t("common.errors.error"), error });
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="flex items-center gap-x-2">
      <Badge variant="softRed">{t("blog.translation.failed")}</Badge>
      {onRetranslate && (
        <Button type="button" size="sm" variant="outline" onClick={() => void retranslate()} disabled={isRetrying}>
          <RotateCcwIcon />
          {t("blog.actions.translateAgain")}
        </Button>
      )}
    </div>
  );
}
