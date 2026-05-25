import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import type { ReactElement } from "react";
import type { HelpArticle } from "../types/help-article.types";
import { _getStaticHelpReader } from "../../../core/registry/helpStore";
import { MDX_SERVER_COMPONENTS } from "../components/mdx/mdx-server-components";

/**
 * Server-side: read the article's raw markdown via the registered help reader
 * and render it through `next-mdx-remote/rsc`'s server-side MDXRemote, using
 * the server-safe MDX components (Callout, Steps, Screenshot, EntityRef,
 * KeyBinding, Video). The returned React element can be embedded inside a
 * server component (e.g. as `children` of `<HelpArticleBody>`).
 *
 * Note: `<Related>` is intentionally not part of the server map — it's a client
 * component that reads HelpContext. Articles that reference `<Related>` would
 * need a separate render path that injects the manifest by prop.
 */
export async function renderHelpArticle(article: HelpArticle): Promise<ReactElement> {
  const readRawMarkdown = _getStaticHelpReader();
  if (!readRawMarkdown) {
    throw new Error(
      "Help reader not configured. Call setHelpReader(fn) from a server-only entrypoint (e.g. Next.js instrumentation register()) before rendering help articles.",
    );
  }
  const source = await readRawMarkdown(article);
  return (
    <MDXRemote
      source={source}
      components={MDX_SERVER_COMPONENTS}
      options={{
        parseFrontmatter: true,
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
        },
      }}
    />
  );
}

/** @deprecated Use `renderHelpArticle` instead — the legacy serialize + client
 *  MDXRemote pattern is incompatible with App Router RSC. */
export const serializeHelpArticle = renderHelpArticle;
