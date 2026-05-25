import type { HelpMode } from "../types/help-article.types";
import type { usePageUrlGenerator } from "../../../client";

export function articleUrl(
  generateUrl: ReturnType<typeof usePageUrlGenerator>,
  article: { mode: HelpMode; slug: string },
): string {
  return generateUrl({ page: `/help/${article.mode}/${article.slug}` });
}

export function modeUrl(generateUrl: ReturnType<typeof usePageUrlGenerator>, mode: HelpMode): string {
  return generateUrl({ page: `/help/${mode}` });
}
