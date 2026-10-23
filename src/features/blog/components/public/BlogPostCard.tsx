"use client";

import { useFormatter } from "next-intl";
import Image from "next/image";
import { MicroLabel, SectionHeader } from "../../../../components/typography";
import { Link } from "../../../../shadcnui";
import { cn } from "../../../../utils/cn";
import { isRemoteImageSrc } from "../../../../utils/isRemoteImageSrc";
import type { PublicBlogCategory, PublicBlogPost } from "../../types/blog-public.types";
import { blogPostHref, resolvePostCategory } from "./blogPublicHelpers";
import { BlogPostMeta } from "./BlogPostMeta";

/**
 * Cover image in a fixed-ratio frame. With no image it renders a
 * token-coloured placeholder of the same footprint, so rows stay aligned.
 */
export function BlogPostCover(props: {
  src?: string;
  alt?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const { src, alt, sizes, priority, className } = props;
  return (
    <div className={cn("border-border bg-primary/10 relative overflow-hidden rounded-lg border", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt ?? ""}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          unoptimized={isRemoteImageSrc(src)}
        />
      ) : null}
    </div>
  );
}

type BlogPostCardVariant = "hero" | "large" | "card" | "row";

/**
 * One post in a public list.
 * - hero: image and text side by side, author and date (featured layout)
 * - large: image above text, author and date (rail layout)
 * - card: small grid card (featured grid, rail columns, related posts)
 * - row: image at the start, text at the end (column layout)
 * The title link is stretched over the whole card, so the card is one target
 * whose accessible name is the title alone.
 */
export function BlogPostCard(props: {
  post: PublicBlogPost;
  categories: PublicBlogCategory[];
  basePath: string;
  variant?: BlogPostCardVariant;
  priority?: boolean;
  headingLevel?: "h2" | "h3";
}) {
  const { post, categories, basePath, variant = "card", priority, headingLevel = "h2" } = props;
  const format = useFormatter();
  const category = resolvePostCategory(post, categories);
  const isProminent = variant === "hero" || variant === "large";

  const eyebrow =
    variant === "row" && post.publishedAt
      ? [category?.name, format.dateTime(new Date(post.publishedAt), { day: "numeric", month: "short" })]
          .filter(Boolean)
          .join(" · ")
      : category?.name;

  const text = (
    <div className="flex min-w-0 flex-col">
      {eyebrow ? <MicroLabel as="span">{eyebrow}</MicroLabel> : null}
      <SectionHeader level={headingLevel === "h3" ? 3 : 2} className="mt-1.5">
        <Link href={blogPostHref(basePath, post.slug)} className="after:absolute after:inset-0">
          {post.title}
        </Link>
      </SectionHeader>
      {post.summary ? <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{post.summary}</p> : null}
      <BlogPostMeta post={post} showAuthor={isProminent} showDate={isProminent} className="mt-3" />
    </div>
  );

  if (variant === "hero") {
    return (
      <article className="group relative grid items-center gap-6 md:grid-cols-[1.4fr_1fr] md:gap-10">
        <BlogPostCover
          src={post.coverImage}
          alt={post.coverImageAlt}
          sizes="(min-width: 1024px) 560px, (min-width: 768px) 58vw, 100vw"
          priority={priority}
          className="aspect-[16/10]"
        />
        {text}
      </article>
    );
  }

  if (variant === "row") {
    return (
      <article className="group relative grid items-center gap-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
        <BlogPostCover
          src={post.coverImage}
          alt={post.coverImageAlt}
          sizes="(min-width: 640px) 160px, 100vw"
          priority={priority}
          className="aspect-[16/10]"
        />
        {text}
      </article>
    );
  }

  return (
    <article className="group relative flex flex-col gap-4">
      <BlogPostCover
        src={post.coverImage}
        alt={post.coverImageAlt}
        sizes={
          variant === "large"
            ? "(min-width: 1024px) 760px, 100vw"
            : "(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
        }
        priority={priority}
        className={variant === "large" ? "aspect-[16/8]" : "aspect-[16/10]"}
      />
      {text}
    </article>
  );
}
