"use client";

import { useCallback, useEffect, useState } from "react";
import { BlogCategoryService } from "../data";
import { blogCategoryAdminName } from "../components/admin/BlogTranslationStatus";

/**
 * Category names for the admin views, in each category's original language.
 *
 * A post response includes its categories without their translations (the
 * framework includes one level), so the name is not on the included record.
 * The category list does include the translations: it is read once and the
 * returned lookup maps a category id to its name ("" while loading).
 */
export function useBlogCategoryNames(): (categoryId: string) => string {
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    BlogCategoryService.findMany({ fetchAll: true })
      .then((categories) => {
        if (cancelled) return;
        setNames(Object.fromEntries(categories.map((category) => [category.id, blogCategoryAdminName(category)])));
      })
      .catch(() => {
        // The names are decoration on an admin page: a failed read leaves the ids unnamed.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return useCallback((categoryId: string) => names[categoryId] ?? "", [names]);
}
