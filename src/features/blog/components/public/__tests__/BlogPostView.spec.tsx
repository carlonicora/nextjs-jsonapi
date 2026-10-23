import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { configureI18n } from "../../../../../i18n";
import type { PublicBlogCategory, PublicBlogPost } from "../../../types/blog-public.types";
import { BlogPostView } from "../BlogPostView";

// t interpolates its values after the key so assertions can see them.
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${Object.values(values).join(" ")}` : key,
  useFormatter: () => ({ dateTime: (date: Date) => date.toISOString().slice(0, 10) }),
}));
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
// The real editor is a next/dynamic ssr:false import; assert on the props it receives.
vi.mock("../../../../../components/editors/BlockNoteEditorContainer", () => ({
  BlockNoteEditorContainer: ({ id, type, initialContent }: { id: string; type: string; initialContent: unknown }) => (
    <div data-testid="post-body" data-id={id} data-type={type}>
      {JSON.stringify(initialContent)}
    </div>
  ),
}));

const cats: PublicBlogCategory[] = [{ id: "c1", name: "Game prep", slug: "game-prep" }];

const post = (overrides: Partial<PublicBlogPost>): PublicBlogPost => ({
  id: "p",
  language: "en",
  title: "Title",
  slug: "title",
  readingMinutes: 4,
  publishedAt: "2026-10-12T09:00:00.000Z",
  updatedAt: "2026-10-12T09:00:00.000Z",
  categoryIds: ["c1"],
  ...overrides,
});

const main = post({
  id: "p1",
  title: "Prep situations, not plots",
  slug: "prep-situations",
  summary: "Why a scene that can go three ways beats a scene that must go one way.",
  body: [{ type: "paragraph", content: [{ type: "text", text: "Every GM has lived that moment" }] }],
  coverImage: "https://cdn.test/p1.webp",
  coverImageAlt: "A table with dice",
  readingMinutes: 6,
  authorName: "Carlo Nicora",
  updatedAt: "2026-10-15T09:00:00.000Z",
});
const r1 = post({
  id: "r1",
  title: "Clues that point, not explain",
  slug: "clues",
  summary: "Make every clue a pointer.",
});
const r2 = post({ id: "r2", title: "Three-way scenes", slug: "three-way" });

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
    usePathname: () => "/blog/prep-situations",
    getLocale: async () => "en",
    Link: ({ href, children, prefetch: _prefetch, scroll: _scroll, ...props }: any) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  });
});

describe("BlogPostView", () => {
  it("shows category, title, author, reading time and more-in links", () => {
    render(<BlogPostView post={main} categories={cats} related={[r1, r2]} basePath="/blog" />);

    expect(screen.getByRole("link", { name: /blog\.public\.back/ })).toHaveAttribute("href", "/blog");
    expect(screen.getAllByText("Game prep")[0]).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Prep situations, not plots" })).toBeInTheDocument();
    expect(screen.getByText(main.summary!)).toBeInTheDocument();
    expect(screen.getByText("blog.public.by Carlo Nicora")).toBeInTheDocument();
    expect(screen.getByText(/blog\.public\.readingTime 6/)).toBeInTheDocument();
    expect(screen.getByAltText("A table with dice")).toHaveAttribute("src", "https://cdn.test/p1.webp");
    const body = screen.getByTestId("post-body");
    expect(body).toHaveTextContent("Every GM has lived that moment");
    expect(body).toHaveAttribute("data-id", "p1");
    expect(body).toHaveAttribute("data-type", "blog-post");

    expect(screen.getByRole("heading", { level: 2, name: "blog.public.moreIn Game prep" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Clues that point, not explain" })).toHaveAttribute("href", "/blog/clues");
    expect(screen.getByRole("link", { name: "Three-way scenes" })).toHaveAttribute("href", "/blog/three-way");
  });

  it("shows updated only when the post changed more than a day after publishing", () => {
    const { rerender } = render(<BlogPostView post={main} categories={cats} related={[]} basePath="/blog" />);
    expect(screen.getByText(/blog\.public\.updated 2026-10-15/)).toBeInTheDocument();

    rerender(
      <BlogPostView
        post={{ ...main, updatedAt: "2026-10-12T15:00:00.000Z" }}
        categories={cats}
        related={[]}
        basePath="/blog"
      />,
    );
    expect(screen.queryByText(/blog\.public\.updated/)).not.toBeInTheDocument();
  });

  it("omits the more-in section when there are no related posts", () => {
    render(<BlogPostView post={main} categories={cats} related={[]} basePath="/blog" />);
    expect(screen.queryByText(/blog\.public\.moreIn/)).not.toBeInTheDocument();
  });

  it("caps related posts at three", () => {
    const many = [1, 2, 3, 4].map((n) => post({ id: `r${n}`, title: `Related ${n}`, slug: `related-${n}` }));
    render(<BlogPostView post={main} categories={cats} related={many} basePath="/blog" />);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
  });
});
