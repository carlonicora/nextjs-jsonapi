import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { BlogPostInterface, BlogPostTranslationInterface } from "../../../data";
import { BlogPostTranslationPanel } from "../BlogPostTranslationPanel";

const { retranslate } = vi.hoisted(() => ({ retranslate: vi.fn() }));

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("../../../data", () => ({ BlogPostTranslationService: { retranslate } }));
vi.mock("../../../hooks/useBlogCategoryNames", () => ({ useBlogCategoryNames: () => () => "" }));
// Editors and the BlockNote field display are not under test.
vi.mock("../BlogPostEditor", () => ({ BlogPostEditor: () => <span>post-editor</span> }));
vi.mock("../BlogPostTranslationEditor", () => ({
  BlogPostTranslationEditor: () => <span>translation-editor</span>,
}));
vi.mock("../BlogPostComparison", () => ({
  BlogPostTranslationFields: () => <div data-testid="fields" />,
  BlogPostComparison: () => <div data-testid="comparison" />,
}));

const english = {
  id: "t-en",
  language: "en",
  isOriginal: true,
  source: "original",
  aiStatus: "completed",
  title: "Prep situations, not plots",
  slug: "prep-situations-not-plots",
  summary: "Why a scene that can go three ways beats one that must go one way.",
  body: [],
  readingMinutes: 6,
} as unknown as BlogPostTranslationInterface;

const translation = (overrides: Record<string, unknown>) =>
  ({
    id: "t-it",
    language: "it",
    isOriginal: false,
    source: "ai",
    aiStatus: "completed",
    title: "Prepara situazioni, non trame",
    slug: "prepara-situazioni-non-trame",
    body: [],
    readingMinutes: 6,
    translatedAt: new Date("2026-10-12T09:00:00.000Z"),
    ...overrides,
  }) as unknown as BlogPostTranslationInterface;

const manualItalian = translation({ source: "manual" });

const post = {
  id: "p1",
  status: "published",
  originalLanguage: "en",
  publishedAt: new Date("2026-10-12T09:00:00.000Z"),
  categories: [],
  translations: [english, manualItalian],
  original: english,
  categoryIds: [],
} as unknown as BlogPostInterface;

describe("BlogPostTranslationPanel", () => {
  it("warns that editing the original replaces hand edits", () => {
    render(<BlogPostTranslationPanel post={post} translation={manualItalian} />);
    expect(screen.getByText("blog.translation.editedByHand")).toBeInTheDocument();
    expect(screen.getByText("blog.translation.overwriteWarning")).toBeInTheDocument();
    expect(screen.getByText("blog.translation.translatedFrom")).toBeInTheDocument();
  });

  it("opens the comparison with the original on demand", () => {
    render(<BlogPostTranslationPanel post={post} translation={manualItalian} />);
    expect(screen.queryByTestId("comparison")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("blog.actions.compareWithOriginal"));
    expect(screen.getByTestId("comparison")).toBeInTheDocument();
    expect(screen.getByText("blog.actions.hideComparison")).toBeInTheDocument();
  });

  it("failed translation shows Translate again, which re-queues that language", async () => {
    const onChanged = vi.fn().mockResolvedValue(undefined);
    retranslate.mockResolvedValue(undefined);
    render(
      <BlogPostTranslationPanel post={post} translation={translation({ aiStatus: "failed" })} onChanged={onChanged} />,
    );

    expect(screen.getByText("blog.translation.failed")).toBeInTheDocument();
    fireEvent.click(screen.getByText("blog.actions.translateAgain"));

    await waitFor(() => expect(retranslate).toHaveBeenCalledWith({ id: "t-it" }));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it("original tab shows the Original badge and no overwrite warning", () => {
    render(<BlogPostTranslationPanel post={post} translation={english} />);
    expect(screen.getByText("blog.translation.original")).toBeInTheDocument();
    expect(screen.getByText("post-editor")).toBeInTheDocument();
    expect(screen.queryByText("blog.translation.overwriteWarning")).not.toBeInTheDocument();
    expect(screen.queryByText("blog.translation.editedByHand")).not.toBeInTheDocument();
  });
});
