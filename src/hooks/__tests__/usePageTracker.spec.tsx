import { render, waitFor } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { recentPagesAtom, type RecentPage } from "../../atoms";
import { usePageTracker } from "../usePageTracker";

// usePathname is globally mocked to "/" in vitest.setup.ts. Override it here so
// navigations can be simulated. A spec-level vi.mock takes precedence.
//
// The hook's stale-observer guard reads the REAL browser location
// (window.location.pathname), not this mock, so every write to
// pathnameRef.current also pushes the browser history entry. Individual tests
// still just say `pathnameRef.current = "..."` — this only keeps the two in
// sync underneath that.
let _pathname = "/";
const pathnameRef = {
  get current() {
    return _pathname;
  },
  set current(value: string) {
    _pathname = value;
    window.history.pushState({}, "", value);
  },
};
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameRef.current,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("../../client/config", () => ({
  getTrackablePages: () => [
    { pageUrl: "/npcs", name: "npcs" },
    { pageUrl: "/campaigns", name: "campaigns" },
  ],
}));

function Harness() {
  usePageTracker();
  return null;
}

function mount(store: ReturnType<typeof createStore>) {
  return render(
    <Provider store={store}>
      <Harness />
    </Provider>,
  );
}

function pages(store: ReturnType<typeof createStore>): RecentPage[] {
  return store.get(recentPagesAtom);
}

beforeEach(() => {
  pathnameRef.current = "/";
  document.title = "Home | App";
});

describe("usePageTracker", () => {
  it("records the entity name on a hard load, where the title is already ours", async () => {
    pathnameRef.current = "/npcs/npc-1";
    document.title = "[NPC] Charlie | App";
    const store = createStore();
    store.set(recentPagesAtom, []);

    mount(store);

    await waitFor(() => expect(pages(store)).toHaveLength(1));
    expect(pages(store)[0]).toMatchObject({ url: "/npcs/npc-1", title: "Charlie", moduleType: "npcs" });
  });

  it("never stamps an entity with the previous page's name, then upgrades when the title lands", async () => {
    // The defect this fixes: the route commits before its streamed metadata, so
    // document.title still belongs to the page we came from.
    pathnameRef.current = "/campaigns/camp-1";
    document.title = "[Campaign] Venezia Obscura | App";
    const store = createStore();
    store.set(recentPagesAtom, []);
    const view = mount(store);
    await waitFor(() => expect(pages(store)[0]?.title).toBe("Venezia Obscura"));

    // Client-side navigate to an NPC. The title has NOT changed yet.
    pathnameRef.current = "/npcs/npc-1";
    view.rerender(
      <Provider store={store}>
        <Harness />
      </Provider>,
    );

    await waitFor(() => expect(pages(store)[0]?.url).toBe("/npcs/npc-1"));
    expect(pages(store)[0].title).toBe("npcs");
    expect(pages(store)[0].title).not.toBe("Venezia Obscura");

    // Now the route's own metadata streams in.
    document.title = "[NPC] Charlie | App";

    await waitFor(() => expect(pages(store)[0]?.title).toBe("Charlie"));
    expect(pages(store)).toHaveLength(2);
  });

  it("records the entity name immediately when the title arrives in the same commit as the navigation", async () => {
    // The prefetched-production ordering: the link's payload (including the new
    // <title>) is already cached, so React updates the route AND the title in
    // the same commit. There is no intermediate tick where the NPC's route is
    // live but document.title still reads the campaign's — which is the signal
    // the "seed with the module name, let the observer correct it" path above
    // depends on. This is the exact scenario an earlier version of this test
    // suite was written to assert and then reordered away from without a guard
    // in place: it described a real case the code did not yet handle.
    pathnameRef.current = "/campaigns/camp-1";
    document.title = "[Campaign] Venezia Obscura | App";
    const store = createStore();
    store.set(recentPagesAtom, []);
    const view = mount(store);
    await waitFor(() => expect(pages(store)[0]?.title).toBe("Venezia Obscura"));

    // Client-side navigate to an NPC. The title has ALREADY changed, before
    // rerender() is even called.
    pathnameRef.current = "/npcs/npc-1";
    document.title = "[NPC] Charlie | App";
    view.rerender(
      <Provider store={store}>
        <Harness />
      </Provider>,
    );

    await waitFor(() => expect(pages(store)[0]?.url).toBe("/npcs/npc-1"));
    expect(pages(store)[0].title).toBe("Charlie");
    expect(pages(store)[0].title).not.toBe("npcs");
  });

  it("does not let a stale observer rename the entry we left", async () => {
    // React runs a route's effect cleanup (disconnecting its observer) as part
    // of the SAME synchronous flush that mounts the next route's effect — so a
    // plain `rerender()` in this test harness can never catch the campaign's
    // observer still connected; cleanup would always have already run by the
    // time any queued mutation callback got a chance to fire. The real bug
    // needs the browser to have already moved on (window.location changed)
    // while the campaign's MutationObserver is still live, i.e. a mutation
    // that lands and is allowed to flush BEFORE React reconciles the
    // navigation. So: change the pathname (which pushes real browser history,
    // see pathnameRef above) and the title, then yield to the microtask queue
    // — WITHOUT calling rerender() yet — so the still-mounted campaign
    // effect's observer is the one that receives the mutation, exactly as it
    // would in production between the DOM commit and the deferred passive
    // effect cleanup.
    pathnameRef.current = "/campaigns/camp-1";
    document.title = "[Campaign] Venezia Obscura | App";
    const store = createStore();
    store.set(recentPagesAtom, []);
    const view = mount(store);
    await waitFor(() => expect(pages(store)[0]?.title).toBe("Venezia Obscura"));

    pathnameRef.current = "/npcs/npc-1";
    document.title = "[NPC] Charlie | App";
    // Let the campaign's still-connected observer see this mutation before its
    // cleanup ever runs.
    await new Promise((resolve) => setTimeout(resolve, 0));

    const campaignEntry = () => pages(store).find((page) => page.url === "/campaigns/camp-1");
    expect(campaignEntry()?.title).toBe("Venezia Obscura");

    // Now let React actually reconcile the navigation.
    view.rerender(
      <Provider store={store}>
        <Harness />
      </Provider>,
    );

    await waitFor(() => expect(pages(store)[0]?.url).toBe("/npcs/npc-1"));
    expect(campaignEntry()?.title).toBe("Venezia Obscura");
  });

  it("ignores head mutations that do not change the resolved title", async () => {
    pathnameRef.current = "/npcs/npc-1";
    document.title = "[NPC] Charlie | App";
    const store = createStore();
    store.set(recentPagesAtom, []);
    mount(store);
    await waitFor(() => expect(pages(store)).toHaveLength(1));
    const firstTimestamp = pages(store)[0].timestamp;

    // Dev servers mutate <head> constantly for HMR styles.
    const style = document.createElement("style");
    document.head.appendChild(style);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(pages(store)).toHaveLength(1);
    expect(pages(store)[0].timestamp).toBe(firstTimestamp);
  });

  it("records nothing for a list route with no entity id", async () => {
    pathnameRef.current = "/npcs";
    document.title = "[NPC] npcs | App";
    const store = createStore();
    store.set(recentPagesAtom, []);
    mount(store);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(pages(store)).toHaveLength(0);
  });

  it("records nothing for a module that is not trackable", async () => {
    pathnameRef.current = "/secrets/secret-1";
    document.title = "[Secret] Hidden | App";
    const store = createStore();
    store.set(recentPagesAtom, []);
    mount(store);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(pages(store)).toHaveLength(0);
  });

  it("stops observing once unmounted", async () => {
    pathnameRef.current = "/npcs/npc-1";
    document.title = "[NPC] Charlie | App";
    const store = createStore();
    store.set(recentPagesAtom, []);
    const view = mount(store);
    await waitFor(() => expect(pages(store)[0]?.title).toBe("Charlie"));

    view.unmount();
    document.title = "[NPC] Bob | App";

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(pages(store)[0].title).toBe("Charlie");
  });

  it("refreshes an entity's entry from a sub-page without renaming it", async () => {
    // Sub-pages title themselves after the section — "[Campaign] NPCs Venezia
    // Obscura" — so they must never overwrite the entity's own name.
    pathnameRef.current = "/campaigns/camp-1";
    document.title = "[Campaign] Venezia Obscura | App";
    const store = createStore();
    store.set(recentPagesAtom, []);
    const view = mount(store);
    await waitFor(() => expect(pages(store)[0]?.title).toBe("Venezia Obscura"));
    const firstTimestamp = pages(store)[0].timestamp;

    pathnameRef.current = "/campaigns/camp-1//npcs";
    document.title = "[Campaign] NPCs Venezia Obscura | App";
    view.rerender(
      <Provider store={store}>
        <Harness />
      </Provider>,
    );

    await waitFor(() => expect(pages(store)[0]?.timestamp).not.toBe(firstTimestamp));
    expect(pages(store)[0].title).toBe("Venezia Obscura");
    expect(pages(store)[0].url).toBe("/campaigns/camp-1");
    expect(pages(store)).toHaveLength(1);
  });

  it("falls back to the module name when a sub-page is the first thing recorded", async () => {
    pathnameRef.current = "/campaigns/camp-1//npcs";
    document.title = "[Campaign] NPCs Venezia Obscura | App";
    const store = createStore();
    store.set(recentPagesAtom, []);
    mount(store);

    await waitFor(() => expect(pages(store)).toHaveLength(1));
    expect(pages(store)[0]).toMatchObject({ url: "/campaigns/camp-1", title: "campaigns" });
  });

  it("still upgrades the title when the entity's own page is opened later", async () => {
    pathnameRef.current = "/campaigns/camp-1//npcs";
    document.title = "[Campaign] NPCs Venezia Obscura | App";
    const store = createStore();
    store.set(recentPagesAtom, []);
    const view = mount(store);
    await waitFor(() => expect(pages(store)[0]?.title).toBe("campaigns"));

    // Navigate to the entity's own page. As in the real app, the route commits
    // BEFORE its metadata streams in, so the title still reads the sub-page's
    // until after the rerender — which is exactly what the observer is for.
    pathnameRef.current = "/campaigns/camp-1";
    view.rerender(
      <Provider store={store}>
        <Harness />
      </Provider>,
    );

    document.title = "[Campaign] Venezia Obscura | App";

    await waitFor(() => expect(pages(store)[0]?.title).toBe("Venezia Obscura"));
  });
});
