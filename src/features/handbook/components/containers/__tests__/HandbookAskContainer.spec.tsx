import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { DataClassRegistry } from "../../../../../core/registry/DataClassRegistry";
import { ApiRequestDataTypeInterface } from "../../../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../../../core/registry/ModuleRegistry";
import { HandbookThread } from "../../../data/HandbookThread";
import { HandbookThreadMessage } from "../../../data/HandbookThreadMessage";
import { HandbookThreadMessageService } from "../../../data/HandbookThreadMessageService";
import { HandbookThreadService } from "../../../data/HandbookThreadService";
import { HandbookAskContainer } from "../HandbookAskContainer";

vi.mock("../../../data/HandbookThreadService", () => ({
  HandbookThreadService: {
    findMany: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    rename: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../../data/HandbookThreadMessageService", () => ({
  HandbookThreadMessageService: { ask: vi.fn() },
}));

// RoundPageContainer is page chrome — header, details panel, url rewriting.
// None of it is under test here, and all of it needs providers this spec has no
// reason to mount. The stub still renders `details`, because that is where the
// thread list lives in this layout (copied from AssistantPageContainer).
vi.mock("../../../../../components/containers/RoundPageContainer", () => ({
  RoundPageContainer: ({ children, details }: { children?: React.ReactNode; details?: React.ReactNode }) => (
    <div>
      {details}
      {children}
    </div>
  ),
}));

// RoundPageContainer reads Modules.HandbookPage; the handbook models resolve
// Modules.HandbookThread / Modules.HandbookThreadMessage lazily through
// ModuleRegistry. Registering is the package's spec convention (see
// HandbookPage.spec.ts) and is preferred to mocking the core barrel, which the
// reused assistant components also import from.
const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

beforeAll(() => {
  registerIfAbsent("HandbookPage", { name: "handbookpages" } as any);
  const threadModule = { name: "handbookthreads", model: HandbookThread } as any;
  const messageModule = { name: "handbookthreadmessages", model: HandbookThreadMessage } as any;
  registerIfAbsent("HandbookThread", threadModule);
  registerIfAbsent("HandbookThreadMessage", messageModule);
  // `_readIncluded` and `rehydrate()` resolve the CONSTRUCTOR through
  // DataClassRegistry, which the app's Bootstrapper fills from the same module
  // definitions — registering only in ModuleRegistry leaves side-loaded
  // messages unrehydratable.
  DataClassRegistry.registerObjectClass(threadModule, HandbookThread as any);
  DataClassRegistry.registerObjectClass(messageModule, HandbookThreadMessage as any);
});

function buildThread(params: {
  id: string;
  title: string;
  updatedAt?: string;
  messages?: { id: string; role: "user" | "assistant"; content: string; position: number; sources?: string[] }[];
}): HandbookThread {
  const messages = params.messages ?? [];
  return new HandbookThread().rehydrate({
    jsonApi: {
      id: params.id,
      type: "handbookthreads",
      attributes: { title: params.title },
      meta: { updatedAt: params.updatedAt ?? new Date().toISOString() },
      relationships: {
        messages: { data: messages.map((m) => ({ id: m.id, type: "handbookthreadmessages" })) },
      },
    },
    included: messages.map((m) => ({
      id: m.id,
      type: "handbookthreadmessages",
      attributes: { role: m.role, content: m.content, position: m.position, sources: m.sources ?? [] },
    })),
  } as any);
}

/** The send control belongs to the shared AssistantComposer, not to this feature. */
const sendButton = () => screen.getByRole("button", { name: /handbook\.chat\.ask/i });

describe("HandbookAskContainer", () => {
  beforeEach(() => {
    vi.mocked(HandbookThreadService.findMany).mockReset().mockResolvedValue([]);
    vi.mocked(HandbookThreadService.findOne).mockReset();
    vi.mocked(HandbookThreadService.create).mockReset();
    vi.mocked(HandbookThreadService.delete).mockReset().mockResolvedValue(undefined);
    vi.mocked(HandbookThreadService.rename).mockReset().mockResolvedValue(undefined);
    vi.mocked(HandbookThreadMessageService.ask).mockReset().mockResolvedValue(undefined);
  });

  it("reuses the shared composer and sidebar but never the assistant's copy", async () => {
    render(<HandbookAskContainer />);

    expect(screen.getByPlaceholderText("handbook.chat.placeholder")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("features.assistant.composer_placeholder")).not.toBeInTheDocument();
    expect(sendButton()).toBeDisabled();
    expect(screen.getByRole("button", { name: /handbook\.chat\.new/ })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("handbook.chat.empty_sidebar")).toBeInTheDocument());
    expect(screen.queryByText("features.assistant.empty_sidebar")).not.toBeInTheDocument();
  });

  it("shows the handbook empty state until a thread exists", async () => {
    render(<HandbookAskContainer />);

    expect(screen.getByText("handbook.chat.empty_state.title")).toBeInTheDocument();
    expect(screen.getByText("handbook.chat.empty_state.subtitle")).toBeInTheDocument();
    await waitFor(() => expect(HandbookThreadService.findMany).toHaveBeenCalled());
  });

  it("lists the previous threads in the sidebar", async () => {
    vi.mocked(HandbookThreadService.findMany).mockResolvedValue([
      buildThread({ id: "t1", title: "Filtri di azienda" }),
      buildThread({ id: "t2", title: "Porte del worker" }),
    ]);

    render(<HandbookAskContainer />);

    await waitFor(() => expect(screen.getByRole("button", { name: "Filtri di azienda" })).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Porte del worker" })).toBeInTheDocument();
  });

  it("loads the messages of the thread picked from the sidebar", async () => {
    vi.mocked(HandbookThreadService.findMany).mockResolvedValue([
      buildThread({ id: "t1", title: "Filtri di azienda" }),
    ]);
    vi.mocked(HandbookThreadService.findOne).mockResolvedValue(
      buildThread({
        id: "t1",
        title: "Filtri di azienda",
        messages: [
          { id: "m1", role: "user", content: "Come funziona buildDefaultMatch?", position: 0 },
          { id: "m2", role: "assistant", content: "Inietta il filtro di azienda.", position: 1 },
        ],
      }),
    );

    render(<HandbookAskContainer />);
    await userEvent.click(await screen.findByRole("button", { name: "Filtri di azienda" }));

    await waitFor(() => expect(HandbookThreadService.findOne).toHaveBeenCalledWith({ id: "t1" }));
    expect(await screen.findByText("Come funziona buildDefaultMatch?")).toBeInTheDocument();
    expect(screen.getByText(/Inietta il filtro di azienda/)).toBeInTheDocument();
  });

  it("asks the trimmed question, creates a thread and shows its title", async () => {
    vi.mocked(HandbookThreadService.create).mockResolvedValue(buildThread({ id: "t9", title: "Filtri di azienda" }));
    vi.mocked(HandbookThreadService.findOne).mockResolvedValue(
      buildThread({
        id: "t9",
        title: "Filtri di azienda",
        messages: [
          { id: "m1", role: "user", content: "Come funziona buildDefaultMatch?", position: 0 },
          { id: "m2", role: "assistant", content: "Inietta il filtro di azienda.", position: 1 },
        ],
      }),
    );

    render(<HandbookAskContainer />);
    await userEvent.type(screen.getByRole("textbox"), "  Come funziona buildDefaultMatch?  ");
    await userEvent.click(sendButton());

    await waitFor(() =>
      expect(HandbookThreadService.create).toHaveBeenCalledWith(
        expect.objectContaining({ question: "Come funziona buildDefaultMatch?" }),
      ),
    );

    // The title only exists server-side until the thread is read back, so its
    // appearance in the sidebar row is the proof the transcript was reloaded.
    await waitFor(() => expect(screen.getAllByText("Filtri di azienda").length).toBeGreaterThan(0));
    expect(screen.getByText(/Inietta il filtro di azienda/)).toBeInTheDocument();

    // There is exactly ONE header on this page — RoundPageContainer's. The
    // assistant's per-thread header is deliberately not rendered, so neither
    // its rename nor its delete control may appear.
    expect(screen.queryByRole("button", { name: "features.assistant.rename" })).toBeNull();
    expect(screen.queryByRole("button", { name: "features.assistant.delete" })).toBeNull();
  });

  it("appends to the open thread instead of creating a second one", async () => {
    vi.mocked(HandbookThreadService.findMany).mockResolvedValue([
      buildThread({ id: "t1", title: "Filtri di azienda" }),
    ]);
    vi.mocked(HandbookThreadService.findOne).mockResolvedValue(
      buildThread({
        id: "t1",
        title: "Filtri di azienda",
        messages: [{ id: "m1", role: "assistant", content: "Inietta il filtro di azienda.", position: 1 }],
      }),
    );

    render(<HandbookAskContainer />);
    await userEvent.click(await screen.findByRole("button", { name: "Filtri di azienda" }));
    await waitFor(() => expect(screen.getByText(/Inietta il filtro di azienda/)).toBeInTheDocument());

    await userEvent.type(screen.getByRole("textbox"), "E i cursori?");
    await userEvent.click(sendButton());

    await waitFor(() =>
      expect(HandbookThreadMessageService.ask).toHaveBeenCalledWith(
        expect.objectContaining({ threadId: "t1", question: "E i cursori?" }),
      ),
    );
    expect(HandbookThreadService.create).not.toHaveBeenCalled();
  });

  it("renders the cited sources inside the answer", async () => {
    vi.mocked(HandbookThreadService.create).mockResolvedValue(buildThread({ id: "t9", title: "Fonti" }));
    vi.mocked(HandbookThreadService.findOne).mockResolvedValue(
      buildThread({
        id: "t9",
        title: "Fonti",
        messages: [
          {
            id: "m2",
            role: "assistant",
            content: "Inietta il filtro di azienda.",
            position: 1,
            sources: ["03-backend/repositories.md", "02-framework/security.md"],
          },
        ],
      }),
    );

    render(<HandbookAskContainer />);
    await userEvent.type(screen.getByRole("textbox"), "Perché?");
    await userEvent.click(sendButton());

    await waitFor(() => expect(screen.getByText("03-backend/repositories.md")).toBeInTheDocument());
    expect(screen.getByText("02-framework/security.md")).toBeInTheDocument();
    expect(screen.getByText("handbook.chat.sources")).toBeInTheDocument();
  });

  it("surfaces a failure as an assistant message rather than an error pane", async () => {
    vi.mocked(HandbookThreadService.create).mockRejectedValue(new Error("AI is not configured"));

    render(<HandbookAskContainer />);
    await userEvent.type(screen.getByRole("textbox"), "Perché?");
    await userEvent.click(sendButton());

    await waitFor(() => expect(screen.getByText("handbook.chat.failed")).toBeInTheDocument());
  });

  it("keeps the asked question in the transcript when the answer fails", async () => {
    vi.mocked(HandbookThreadService.create).mockRejectedValue(new Error("boom"));

    render(<HandbookAskContainer />);
    await userEvent.type(screen.getByRole("textbox"), "Che porte usa il worker?");
    await userEvent.click(sendButton());

    await waitFor(() => expect(screen.getByText("Che porte usa il worker?")).toBeInTheDocument());
  });
});
