import { render } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MentionLoadMoreFn, MentionSearchFn } from "../BlockNoteEditorSuggestionMenuController";
import { BlockNoteEditorMentionSuggestionMenu, useMentionLoadMore } from "../BlockNoteEditorSuggestionMenuController";

const captured = vi.hoisted(() => ({
  getItems: null as null | ((query: string) => Promise<any[]>),
  loadMore: null as null | MentionLoadMoreFn,
  // Set below once the module under test is imported; the mock cannot import it.
  useLoadMore: null as null | (() => MentionLoadMoreFn | null),
}));

vi.mock("@blocknote/react", () => ({
  SuggestionMenuController: (props: { getItems: (query: string) => Promise<any[]> }) => {
    captured.getItems = props.getItems;
    captured.loadMore = captured.useLoadMore!();
    return null;
  },
}));

captured.useLoadMore = useMentionLoadMore;

function setup(results: Awaited<ReturnType<MentionSearchFn>>) {
  const editor = { insertInlineContent: vi.fn() };
  const search = vi.fn<MentionSearchFn>().mockResolvedValue(results);
  const params = { campaignId: "c1" };
  render(
    <BlockNoteEditorMentionSuggestionMenu editor={editor as any} mentionSearchFn={search} mentionSearchParams={params} />,
  );
  return { editor, search, params };
}

describe("BlockNoteEditorMentionSuggestionMenu", () => {
  beforeEach(() => {
    captured.getItems = null;
    captured.loadMore = null;
  });

  it("getItems searches the first page with no offset", async () => {
    const { search, params } = setup([{ id: "n1", name: "Anna", entityType: "npcs" }]);
    const items = await captured.getItems!("an");
    expect(search).toHaveBeenCalledWith("an", params);
    expect(search.mock.calls[0]).toHaveLength(2);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: "n1", entityType: "npcs", title: "Anna" });
  });

  it("loadMore fetches the next page for the last query with the offset", async () => {
    const { search, params, editor } = setup([]);
    await captured.getItems!("first");
    await captured.getItems!("anna");

    search.mockResolvedValueOnce([
      { id: "n26", name: "Anna B", entityType: "npcs" },
      { id: "l3", name: "Annaville", entityType: "locations" },
    ]);
    const more = await captured.loadMore!(25);

    expect(search).toHaveBeenLastCalledWith("anna", params, { offset: 25 });
    expect(more).toHaveLength(2);
    expect(more[0]).toMatchObject({ id: "n26", entityType: "npcs", title: "Anna B", subtext: "npcs" });
    expect(more[1]).toMatchObject({ id: "l3", entityType: "locations", title: "Annaville" });

    more[0].onItemClick();
    expect(editor.insertInlineContent).toHaveBeenCalledWith([
      { type: "mention", props: { alias: "Anna B", id: "n26", entityType: "npcs" } },
      " ",
    ]);
  });

  it("loadMore returns no keep-open sentinel when the page is empty", async () => {
    setup([]);
    const firstPage = await captured.getItems!("zzz");
    expect(firstPage).toHaveLength(1);
    const more = await captured.loadMore!(25);
    expect(more).toEqual([]);
  });
});
