"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { BlogPostInterface, BlogPostService } from "../data";

/** How often the post page re-reads the post while a translation job runs. */
const TRANSLATION_POLL_MS = 5000;

export interface BlogPostContextType {
  post: BlogPostInterface | undefined;
  reload: () => Promise<void>;
}

const BlogPostContext = createContext<BlogPostContextType | undefined>(undefined);

export type BlogPostProviderProps = {
  postId: string;
  children: ReactNode;
};

/**
 * Loads one post (with its translations, categories and author) for the admin
 * post page. While any translation is `pending` or `in_progress` it re-reads
 * the post every 5 s, so the language tabs move from "Translating…" to the
 * translated text without a manual refresh; it stops once none are running.
 */
export const BlogPostProvider = ({ postId, children }: BlogPostProviderProps) => {
  const [post, setPost] = useState<BlogPostInterface | undefined>(undefined);

  const reload = useCallback(async () => {
    const loaded = await BlogPostService.findOne({ id: postId });
    setPost(loaded);
  }, [postId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const isTranslating = useMemo(
    () =>
      (post?.translations ?? []).some(
        (translation) => translation.aiStatus === "pending" || translation.aiStatus === "in_progress",
      ),
    [post],
  );

  useEffect(() => {
    if (!isTranslating) return;
    const handle = setInterval(() => {
      reload().catch(() => {});
    }, TRANSLATION_POLL_MS);
    return () => clearInterval(handle);
  }, [isTranslating, reload]);

  const value = useMemo<BlogPostContextType>(() => ({ post, reload }), [post, reload]);

  return <BlogPostContext.Provider value={value}>{children}</BlogPostContext.Provider>;
};

export const useBlogPost = (): BlogPostContextType => {
  const context = useContext(BlogPostContext);
  if (context === undefined) {
    throw new Error("useBlogPost must be used within a BlogPostProvider");
  }
  return context;
};
