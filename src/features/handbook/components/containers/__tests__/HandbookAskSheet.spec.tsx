import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiRequestDataTypeInterface } from "../../../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../../../core/registry/ModuleRegistry";
import { HandbookAskSheet } from "../HandbookAskSheet";

/**
 * The conversation itself is `useHandbookAsk`'s, and its own spec covers it.
 * What this file proves is the sheet: what it opens with, what the recent menu
 * holds, and what the page chip does to the next question. So the hook is
 * mocked — but with real React state behind `ask`, because "the expand link
 * appears once a thread exists" is a transition, not a snapshot.
 */
const fixtures = vi.hoisted(() => ({
  ask: vi.fn(),
  selectThread: vi.fn(),
  startNew: vi.fn(),
  threads: [] as { id: string; title: string }[],
}));

vi.mock("../../../hooks/useHandbookAsk", async () => {
  const { useState } = await import("react");
  return {
    useHandbookAsk: () => {
      const [thread, setThread] = useState<{ id: string; title: string } | undefined>(undefined);
      return {
        threads: fixtures.threads,
        thread,
        messages: [],
        sending: false,
        ask: async (question: string, options?: { handbookPageId?: string }) => {
          fixtures.ask(question, options);
          setThread({ id: "t1", title: "Filtri di azienda" });
        },
        selectThread: fixtures.selectThread,
        startNew: fixtures.startNew,
      };
    },
  };
});

// The sheet builds its links with `usePageUrlGenerator`, which reads
// `Modules.HandbookPage.pageUrl` through the registry.
const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

beforeAll(() => {
  registerIfAbsent("HandbookPage", { name: "handbookpages", pageUrl: "/administration/handbook" } as any);
});

const open = async () => {
  await userEvent.click(screen.getByRole("button", { name: /handbook\.ask\.open/ }));
};

describe("HandbookAskSheet", () => {
  beforeEach(() => {
    fixtures.ask.mockReset();
    fixtures.selectThread.mockReset();
    fixtures.startNew.mockReset();
    fixtures.threads = [];
  });

  it("opens on a new thread", async () => {
    render(<HandbookAskSheet handbookPageId="p2" />);

    await open();

    expect(await screen.findByText("handbook.chat.empty_state.title")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("handbook.chat.placeholder")).toBeInTheDocument();
  });

  it("lists the five most recent threads and links to the full route", async () => {
    fixtures.threads = Array.from({ length: 7 }, (_, index) => ({
      id: `t${index}`,
      title: `Conversazione ${index}`,
    }));

    render(<HandbookAskSheet />);
    await open();
    await userEvent.click(await screen.findByRole("button", { name: "handbook.ask.recent" }));

    // Five threads plus the "all conversations" row.
    expect(await screen.findAllByRole("menuitem")).toHaveLength(6);
    expect(screen.getByText("Conversazione 4")).toBeInTheDocument();
    expect(screen.queryByText("Conversazione 5")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "handbook.ask.all" })).toHaveAttribute(
      "href",
      "/administration/handbook/chat",
    );
  });

  it("opens a thread picked from the recent menu", async () => {
    fixtures.threads = [{ id: "t3", title: "Filtri di azienda" }];

    render(<HandbookAskSheet />);
    await open();
    await userEvent.click(await screen.findByRole("button", { name: "handbook.ask.recent" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Filtri di azienda" }));

    expect(fixtures.selectThread).toHaveBeenCalledWith("t3");
  });

  it("scopes the question to the page only when the chip is on", async () => {
    render(<HandbookAskSheet handbookPageId="p2" />);
    await open();

    await userEvent.type(await screen.findByRole("textbox"), "Why?{Enter}");
    expect(fixtures.ask).toHaveBeenLastCalledWith("Why?", { handbookPageId: undefined });

    await userEvent.click(screen.getByRole("switch", { name: "handbook.ask.thisPageOnly" }));
    await userEvent.type(screen.getByRole("textbox"), "Again?{Enter}");
    expect(fixtures.ask).toHaveBeenLastCalledWith("Again?", { handbookPageId: "p2" });
  });

  it("offers no page chip when no page is open", async () => {
    render(<HandbookAskSheet />);
    await open();

    await screen.findByRole("textbox");
    expect(screen.queryByRole("switch", { name: "handbook.ask.thisPageOnly" })).toBeNull();
  });

  it("expands to the route on the open thread", async () => {
    render(<HandbookAskSheet />);
    await open();

    expect(screen.queryByRole("link", { name: "handbook.ask.expand" })).toBeNull();

    await userEvent.type(await screen.findByRole("textbox"), "Why?{Enter}");

    expect(await screen.findByRole("link", { name: "handbook.ask.expand" })).toHaveAttribute(
      "href",
      "/administration/handbook/chat/t1",
    );
  });
});
