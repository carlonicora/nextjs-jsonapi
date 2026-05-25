import { describe, it, expect } from "vitest";
import { buildHelpNav, findHelpArticle, prevNextWithinMode } from "../helpNavigation";

const base = {
  tags: [],
  contextualKeys: [],
  aiIndexed: true,
  draft: false,
  contentHash: "h",
  headings: [],
  relatedSlugs: [],
  lastUpdated: "",
};
const manifest = [
  {
    ...base,
    id: "a",
    slug: "a",
    mode: "how-to" as const,
    title: "Alpha",
    summary: "s",
    order: 1,
    path: "how-to/a.mdx",
  },
  { ...base, id: "b", slug: "b", mode: "how-to" as const, title: "Beta", summary: "s", order: 2, path: "how-to/b.mdx" },
  {
    ...base,
    id: "c",
    slug: "c",
    mode: "tutorial" as const,
    title: "Gamma",
    summary: "s",
    order: 1,
    path: "tutorial/c.mdx",
  },
];

describe("helpNavigation", () => {
  it("buildHelpNav groups articles by mode, sorted by order", () => {
    const groups = buildHelpNav(manifest);
    const howTo = groups.find((g) => g.mode === "how-to")!;
    expect(howTo.articles.map((a) => a.slug)).toEqual(["a", "b"]);
  });

  it("findHelpArticle locates by mode + slug", () => {
    expect(findHelpArticle(manifest, "how-to", "b")?.title).toBe("Beta");
    expect(findHelpArticle(manifest, "how-to", "missing")).toBeUndefined();
  });

  it("prevNextWithinMode returns siblings within the same mode", () => {
    const current = manifest[0]; // Alpha (how-to, order 1)
    const { prev, next } = prevNextWithinMode(manifest, current);
    expect(prev).toBeNull();
    expect(next?.slug).toBe("b");
  });

  it("prevNextWithinMode returns null at the boundaries", () => {
    const current = manifest[1]; // Beta (how-to, order 2)
    const { prev, next } = prevNextWithinMode(manifest, current);
    expect(prev?.slug).toBe("a");
    expect(next).toBeNull();
  });

  it("prevNextWithinMode does not cross modes", () => {
    const current = manifest[2]; // Gamma (tutorial)
    const { prev, next } = prevNextWithinMode(manifest, current);
    expect(prev).toBeNull();
    expect(next).toBeNull();
  });
});
