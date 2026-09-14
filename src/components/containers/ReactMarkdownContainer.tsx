"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { cn } from "../../utils/cn";
import { MermaidDiagram } from "./MermaidDiagram";

/**
 * The source of a ```mermaid fence, or `undefined` for any other `pre`.
 *
 * Reads react-markdown's hast node rather than the rendered children: the
 * language lives in the inner `code` element's `language-*` class, and the
 * source is its raw text. Pulling it off the React children would mean
 * unpicking elements that the `code` override has already transformed.
 */
function mermaidSourceOf(node: unknown): string | undefined {
  const pre = node as { children?: { tagName?: string; properties?: { className?: unknown }; children?: unknown[] }[] };
  const code = pre?.children?.[0];
  if (code?.tagName !== "code") return undefined;

  const classNames = Array.isArray(code.properties?.className) ? (code.properties.className as string[]) : [];
  if (!classNames.includes("language-mermaid")) return undefined;

  const text = code.children?.[0] as { type?: string; value?: string } | undefined;
  if (text?.type !== "text" || typeof text.value !== "string") return undefined;

  return text.value;
}

type ReactMarkdownContainerProps = {
  content: string;
  collapsible?: boolean;
  initialLines?: number;
  size?: "small" | "normal";
};

export function ReactMarkdownContainer({
  content,
  collapsible = false,
  initialLines = 4,
  size = "normal",
}: ReactMarkdownContainerProps) {
  const t = useTranslations("ui.buttons");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (collapsible && contentRef.current && !isExpanded) {
      // Check if content exceeds the clamped height
      const isOverflowing = contentRef.current.scrollHeight > contentRef.current.clientHeight;
      setShowExpandButton(isOverflowing);
    }
  }, [collapsible, content, isExpanded]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const clampStyle =
    collapsible && !isExpanded
      ? {
          display: "-webkit-box",
          WebkitLineClamp: initialLines,
          WebkitBoxOrient: "vertical" as const,
          overflow: "hidden",
        }
      : {};

  return (
    <div className="flex flex-col">
      <div className="relative">
        <div ref={contentRef} style={clampStyle} className="transition-all duration-300 ease-in-out">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            // `rehype-slug` puts a stable `id` on every heading. Nothing linked
            // to a heading before, so no markdown surface in the package could
            // carry an in-page table of contents; the handbook reader's one
            // reads these ids straight out of the DOM.
            rehypePlugins={[rehypeSlug]}
            components={{
              // `overflow-wrap:anywhere`, not `break-words`: prose here is full
              // of file paths, and there is no space in
              // `packages/nestjs-neo4jsonapi/src/core/health.controller.ts` for
              // `break-words` to break at. Without it one path widens the page
              // and the whole layout scrolls sideways.
              p: ({ children }) => (
                <p className={cn("[overflow-wrap:anywhere]", size === "small" && "text-xs")}>{children}</p>
              ),
              li: ({ children }) => (
                <li className={cn("[overflow-wrap:anywhere]", size === "small" && "text-xs")}>{children}</li>
              ),
              // Wrapped in its own scroller for the same reason as `pre`: a
              // three-column table of file paths is wider than any reading
              // column, and unwrapped it drags the page sideways with it.
              table: ({ children }) => (
                <div className="overflow-x-auto">
                  {/* `min-w-max` so columns keep their natural width and the
                      wrapper scrolls, rather than the table squeezing until a
                      path breaks mid-word inside a cell. */}
                  <table className="w-full min-w-max table-auto border-collapse border">{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th className={`border px-4 py-2 text-start ${size === "small" ? "px-2 py-1 text-xs" : ""}`}>
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className={`border px-4 py-2 ${size === "small" ? "px-2 py-1 text-xs" : ""}`}>{children}</td>
              ),
              tr: ({ children }) => <tr className="even:bg-gray-50">{children}</tr>,
              ul: ({ children }) => <ul className={`list-disc ${size === "small" ? "ps-3" : "ps-4"}`}>{children}</ul>,
              ol: ({ children }) => (
                <ol className={`list-decimal ${size === "small" ? "ps-3" : "ps-4"}`}>{children}</ol>
              ),
              // Code is not prose: identifiers, paths and command lines read
              // left-to-right in every locale, so both the fenced block and the
              // inline span are deliberate LTR islands. `node` is react-markdown's
              // hast node — it must not reach the DOM element.
              // A ```mermaid fence is a DIAGRAM, not code. It is caught here on
              // the `pre` rather than on the `code` inside it, because the
              // diagram replaces the whole block — catching it a level down
              // would leave it wrapped in the `pre` chrome it is not.
              //
              // A fenced block otherwise scrolls on its own rather than
              // widening the page: a long command line is unbreakable, and
              // without this the whole layout is pushed sideways.
              // rtl-ok: deliberate LTR island (code)
              pre: ({ children, node, ...props }) => {
                const diagram = mermaidSourceOf(node);
                if (diagram !== undefined) return <MermaidDiagram chart={diagram} />;

                return (
                  <pre dir="ltr" {...props} className="overflow-x-auto">
                    {children}
                  </pre>
                );
              },
              // No wrap rule HERE. The same component renders inline spans, the
              // contents of fenced blocks and the contents of table cells; the
              // last two live in their own scrollers, and breaking a path
              // mid-word inside them is worse than scrolling to it. The rule
              // that catches inline code sits on `p` and `li`, which is where
              // inline code actually lives.
              // rtl-ok: deliberate LTR island (code)
              code: ({ children, node: _node, ...props }) => (
                <code dir="ltr" {...props}>
                  {children}
                </code>
              ),
              // The heading overrides spread the node's props, exactly as `pre`
              // and `code` already do: dropping them would throw away the `id`
              // rehype-slug just set and leave every heading unlinkable again.
              // `node` is react-markdown's hast node — it must not reach the DOM.
              h1: ({ children, node: _node, ...props }) => (
                <h1
                  {...props}
                  className={size === "small" ? "my-1 mt-2 text-sm font-bold" : "my-2 mt-4 text-3xl font-semibold"}
                >
                  {children}
                </h1>
              ),
              h2: ({ children, node: _node, ...props }) => (
                <h2
                  {...props}
                  className={size === "small" ? "my-1 mt-2 text-sm font-semibold" : "my-2 mt-4 text-2xl font-semibold"}
                >
                  {children}
                </h2>
              ),
              h3: ({ children, node: _node, ...props }) => (
                <h3
                  {...props}
                  className={size === "small" ? "my-1 mt-2 text-sm font-medium" : "my-2 mt-4 text-xl font-semibold"}
                >
                  {children}
                </h3>
              ),
              h4: ({ children, node: _node, ...props }) => (
                <h4
                  {...props}
                  className={size === "small" ? "my-1 mt-2 text-sm font-medium" : "my-2 mt-4 text-lg font-semibold"}
                >
                  {children}
                </h4>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {collapsible && !isExpanded && showExpandButton && (
          <div className="pointer-events-none absolute end-0 bottom-0 start-0 h-12 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>

      {collapsible && showExpandButton && (
        <div className="mt-2 flex justify-end">
          <button
            onClick={handleToggle}
            className="text-primary flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-100"
            aria-label={isExpanded ? t("show_less") : t("show_more")}
          >
            <span>{isExpanded ? t("show_less") : t("show_more")}</span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      )}
    </div>
  );
}
