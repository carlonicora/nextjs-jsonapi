"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
            components={{
              p: ({ children }) => <p className={size === "small" ? "text-xs" : ""}>{children}</p>,
              li: ({ children }) => <li className={size === "small" ? "text-xs" : ""}>{children}</li>,
              table: ({ children }) => <table className="w-full table-auto border-collapse border">{children}</table>,
              th: ({ children }) => (
                <th className={`border px-4 py-2 text-left ${size === "small" ? "px-2 py-1 text-xs" : ""}`}>
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className={`border px-4 py-2 ${size === "small" ? "px-2 py-1 text-xs" : ""}`}>{children}</td>
              ),
              tr: ({ children }) => <tr className="even:bg-gray-50">{children}</tr>,
              ul: ({ children }) => <ul className={`list-disc ${size === "small" ? "pl-3" : "pl-4"}`}>{children}</ul>,
              ol: ({ children }) => (
                <ol className={`list-decimal ${size === "small" ? "pl-3" : "pl-4"}`}>{children}</ol>
              ),
              h1: ({ children }) => (
                <h1 className={size === "small" ? "my-1 mt-2 text-sm font-bold" : "my-2 mt-4 text-3xl font-medium"}>
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2
                  className={size === "small" ? "my-1 mt-2 text-sm font-semibold" : "my-2 mt-4 text-2xl font-semibold"}
                >
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className={size === "small" ? "my-1 mt-2 text-sm font-medium" : "my-2 mt-4 text-xl font-semibold"}>
                  {children}
                </h3>
              ),
              h4: ({ children }) => (
                <h4 className={size === "small" ? "my-1 mt-2 text-sm font-medium" : "my-2 mt-4 text-lg font-semibold"}>
                  {children}
                </h4>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {collapsible && !isExpanded && showExpandButton && (
          <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-12 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>

      {collapsible && showExpandButton && (
        <div className="mt-2 flex justify-end">
          <button
            onClick={handleToggle}
            className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
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
