import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { configureI18n } from "../../../../../i18n";
import type { PublicBlogCategory, PublicBlogPost } from "../../../types/blog-public.types";
import { BlogList } from "../BlogList";

// t interpolates its values after the key so assertions can see them.
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${Object.values(values).join(" ")}` : key,
  useFormatter: () => ({ dateTime: (date: Date) => date.toISOString().slice(0, 10) }),
}));
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const cats: PublicBlogCategory[] = [
  { id: "c1", name: "Game prep", slug: "game-prep" },
  { id: "c2", name: "Product", slug: "product" },
];

const post = (overrides: Partial<PublicBlogPost>): PublicBlogPost => ({
  id: "p",
  language: "en",
  title: "Title",
  slug: "title",
  summary: "Summary",
  readingMinutes: 4,
  publishedAt: "2026-10-12T09:00:00.000Z",
  updatedAt: "2026-10-12T09:00:00.000Z",
  authorName: "Carlo Nicora",
  categoryIds: ["c1"],
  ...overrides,
});

const p1 = post({
  id: "p1",
  title: "Prep situations, not plots",
  slug: "prep-situations",
  summary: "Why a scene that can go three ways beats a scene that must go one way.",
  coverImage: "https://cdn.test/p1.webp",
});
const p2 = post({
  id: "p2",
  title: "Voice attribution, explained",
  slug: "voice",
  summary: "How it knows who spoke.",
  categoryIds: ["c2"],
});
const p3 = post({
  id: "p3",
  title: "Clues that point, not explain",
  slug: "clues",
  summary: "Make every clue a pointer.",
});

beforeEach(() => {
  configureI18n({
    useRouter: () => ({
      push: () => {},
      replace: () => {},
      back: () => {},
      forward: () => {},
      refresh: () => {},
      prefetch: () => {},
    }),
    useTranslations: () => (key: string) => key,
    usePathname: () => "/blog",
    getLocale: async () => "en",
    Link: ({ href, children, prefetch: _prefetch, scroll: _scroll, ...props }: any) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  });
});

describe("BlogList", () => {
  it.each(["featured", "column", "rail"] as const)("%s layout renders every post title and a summary", (layout) => {
    render(
      <BlogList
        layout={layout}
        list={{ posts: [p1, p2, p3], hasMore: false }}
        categories={cats}
        page={1}
        basePath="/blog"
      />,
    );

    expect(screen.getAllByRole("link", { name: /Prep situations/ })[0]).toHaveAttribute(
      "href",
      "/blog/prep-situations",
    );
    expect(screen.getAllByRole("link", { name: /Voice attribution/ })[0]).toHaveAttribute("href", "/blog/voice");
    expect(screen.getAllByRole("link", { name: /Clues that point/ })[0]).toHaveAttribute("href", "/blog/clues");
    expect(screen.getByText(p3.summary!)).toBeInTheDocument();
    expect(screen.getAllByText(/blog\.public\.readingTime 4/).length).toBeGreaterThanOrEqual(3);
    // One real h1 per page (public SEO page), carried by ContentTitle; the eyebrow is not part of it.
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "blog.public.title" })).toBeInTheDocument();
    expect(screen.getByText("blog.public.eyebrow")).toBeInTheDocument();
    // The public blog shows no dates in any layout.
    expect(screen.queryByText(/2026-10-12/)).not.toBeInTheDocument();
  });

  it("active category chip is marked and links back to all", () => {
    render(
      <BlogList
        layout="featured"
        list={{ posts: [p1], hasMore: false }}
        categories={cats}
        activeCategorySlug="game-prep"
        page={1}
        basePath="/blog"
      />,
    );

    const active = screen.getByRole("link", { name: "Game prep" });
    expect(active).toHaveAttribute("aria-current", "page");
    expect(active).toHaveAttribute("href", "/blog?category=game-prep");
    expect(screen.getByRole("link", { name: "Product" })).not.toHaveAttribute("aria-current");
    const all = screen.getByRole("link", { name: "blog.public.all" });
    expect(all).toHaveAttribute("href", "/blog");
    expect(all).not.toHaveAttribute("aria-current");
  });

  it("load more links to the next page keeping filters", () => {
    render(
      <BlogList
        layout="column"
        list={{ posts: [p1], hasMore: true }}
        categories={cats}
        activeCategorySlug="game-prep"
        query="x"
        page={1}
        basePath="/blog"
      />,
    );

    expect(screen.getByRole("link", { name: "blog.public.loadMore" })).toHaveAttribute(
      "href",
      "/blog?category=game-prep&q=x&page=2",
    );
  });

  it("hides load more when there is nothing more", () => {
    render(
      <BlogList layout="rail" list={{ posts: [p1], hasMore: false }} categories={cats} page={1} basePath="/blog" />,
    );
    expect(screen.queryByRole("link", { name: "blog.public.loadMore" })).not.toBeInTheDocument();
  });

  it("empty list with a query shows noResults", () => {
    render(
      <BlogList
        layout="featured"
        list={{ posts: [], hasMore: false }}
        categories={cats}
        query="zzz"
        page={1}
        basePath="/blog"
      />,
    );
    expect(screen.getByText("blog.public.noResults")).toBeInTheDocument();
    expect(screen.queryByText("blog.public.empty")).not.toBeInTheDocument();
  });

  it("empty list without a query shows empty", () => {
    render(
      <BlogList layout="column" list={{ posts: [], hasMore: false }} categories={cats} page={1} basePath="/blog" />,
    );
    expect(screen.getByText("blog.public.empty")).toBeInTheDocument();
  });
});
