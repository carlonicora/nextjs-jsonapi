"use client";

import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { FormEvent, useEffect, useState } from "react";
import { useI18nRouter } from "../../../../i18n";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../../../../shadcnui";
import { blogListHref } from "./blogPublicHelpers";

/**
 * Search form for the public list. The current query and category come in as
 * props (the page already parsed the search params), so this component never
 * reads `useSearchParams` and needs no Suspense boundary of its own.
 * Submitting keeps the category and resets to page one.
 */
export function BlogSearchBox(props: {
  basePath: string;
  query?: string;
  activeCategorySlug?: string;
  className?: string;
}) {
  const { basePath, query, activeCategorySlug, className } = props;
  const t = useTranslations();
  const router = useI18nRouter();
  const [value, setValue] = useState(query ?? "");

  useEffect(() => setValue(query ?? ""), [query]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = value.trim();
    router.push(blogListHref(basePath, { category: activeCategorySlug, q: q || undefined }));
  };

  return (
    <form role="search" onSubmit={onSubmit} className={className}>
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          name="q"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t("blog.public.searchPlaceholder")}
          aria-label={t("blog.public.search")}
        />
      </InputGroup>
    </form>
  );
}
