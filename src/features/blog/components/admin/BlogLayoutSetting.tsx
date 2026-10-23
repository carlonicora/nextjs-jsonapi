"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { errorToast, SectionHeader } from "../../../../components";
import { RadioGroup, RadioGroupItem } from "../../../../shadcnui";
import { showToast } from "../../../../utils/toast";
import { BlogSettingsService } from "../../data";
import { BLOG_LIST_LAYOUTS, BLOG_SETTINGS_ID, BlogListLayout } from "../../types/blog.constants";

/**
 * Picks the public list layout (featured / column / rail). The choice is saved
 * at once and the public blog uses it within the cache window.
 */
export function BlogLayoutSetting() {
  const t = useTranslations();
  const [layout, setLayout] = useState<BlogListLayout | undefined>(undefined);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    BlogSettingsService.get()
      .then((settings) => {
        if (active) setLayout(settings?.listLayout ?? "featured");
      })
      .catch(() => {
        if (active) setLayout("featured");
      });
    return () => {
      active = false;
    };
  }, []);

  const options: Record<BlogListLayout, { label: string; description: string }> = {
    featured: { label: t("blog.layout.featured"), description: t("blog.layout.featuredDescription") },
    column: { label: t("blog.layout.column"), description: t("blog.layout.columnDescription") },
    rail: { label: t("blog.layout.rail"), description: t("blog.layout.railDescription") },
  };

  const save = async (next: BlogListLayout) => {
    const previous = layout;
    setLayout(next);
    setSaving(true);
    try {
      await BlogSettingsService.save({ id: BLOG_SETTINGS_ID, listLayout: next });
      showToast(t("blog.layout.saved"));
    } catch (error) {
      setLayout(previous);
      errorToast({ title: t("common.errors.error"), error });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex w-full max-w-3xl flex-col gap-y-4 p-4">
      <SectionHeader>{t("blog.layout.title")}</SectionHeader>
      {layout && (
        <RadioGroup
          value={layout}
          onValueChange={(value) => {
            // Base UI can emit a null value; ignore it and an unchanged choice.
            if (!value || value === layout) return;
            void save(value as BlogListLayout);
          }}
          disabled={saving}
          className="grid grid-cols-1 gap-3 md:grid-cols-3"
        >
          {BLOG_LIST_LAYOUTS.map((option) => (
            <label
              key={option}
              htmlFor={`blog-layout-${option}`}
              className="has-data-checked:border-primary flex cursor-pointer items-start gap-x-3 rounded-lg border p-4"
            >
              <RadioGroupItem value={option} id={`blog-layout-${option}`} className="mt-0.5" />
              <span className="flex flex-col gap-y-1">
                <span className="text-sm font-medium">{options[option].label}</span>
                <span className="text-muted-foreground text-xs/relaxed">{options[option].description}</span>
              </span>
            </label>
          ))}
        </RadioGroup>
      )}
    </div>
  );
}
