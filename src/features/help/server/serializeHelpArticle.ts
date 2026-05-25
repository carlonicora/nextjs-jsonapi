import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import type { HelpArticle } from "../types/help-article.types";
import { _getStaticHelpReader } from "../../../core/registry/helpStore";

export async function serializeHelpArticle(article: HelpArticle) {
  const readRawMarkdown = _getStaticHelpReader();
  if (!readRawMarkdown) {
    throw new Error(
      "Help reader not configured. Call setHelpReader(fn) from a server-only entrypoint (e.g. Next.js instrumentation register()) before serializing help articles.",
    );
  }
  const raw = await readRawMarkdown(article);
  return serialize(raw, {
    parseFrontmatter: true,
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
    },
  });
}
