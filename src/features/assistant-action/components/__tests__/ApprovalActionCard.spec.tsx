import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApprovalActionCard } from "../ApprovalActionCard";

/**
 * A message catalogue the test fills in. Keys it does not hold behave like a
 * host app without them: `t()` hands back the key path and `t.has()` is false,
 * so the card must fall back to the humanised attribute name.
 */
const messages = vi.hoisted(() => ({}) as Record<string, string>);

vi.mock("next-intl", () => {
  const t = (key: string) => messages[key] ?? key;
  (t as unknown as { has: (key: string) => boolean }).has = (key: string) => key in messages;
  return {
    useTranslations: () => t,
    useLocale: () => "en",
    useNow: () => new Date(),
    useTimeZone: () => "UTC",
    useFormatter: () => ({ dateTime: vi.fn(), number: vi.fn(), relativeTime: vi.fn() }),
  };
});

/**
 * The BlockNote editor stands in as a plain element: its props are kept per
 * editor id so a test can fire the editor's change callback.
 */
const editors = vi.hoisted(
  () =>
    ({}) as Record<
      string,
      {
        initialContent?: unknown[];
        onChange?: (...args: any[]) => void;
        className?: string;
        bordered?: boolean;
        enableMentions?: boolean;
      }
    >,
);

vi.mock("../../../../components/editors/BlockNoteEditorContainer", () => ({
  BlockNoteEditorContainer: (props: any) => {
    editors[props.id] = props;
    return <div data-testid={`editor-${props.id}`} data-initial-content={JSON.stringify(props.initialContent ?? [])} />;
  },
}));

const findOne = vi.fn();
const approve = vi.fn();
const deny = vi.fn();

vi.mock("../../data/AssistantActionService", () => ({
  AssistantActionService: {
    findOne: (params: { id: string }) => findOne(params),
    approve: (params: { id: string }) => approve(params),
    deny: (params: { id: string }) => deny(params),
  },
}));

/** Any uuid-ish run of hex — no id may ever reach the screen. */
const UUID_LIKE = /[0-9a-f]{8}-[0-9a-f]{4}-/;

const CREATE_TOOL_ARGS = JSON.stringify({
  type: "npcs",
  attributes: { name: "Marcus", tldr: "A nerd with bouts of rage" },
  relationships: { related: { data: [{ type: "npcs", id: "042ec319-9d3c-4f0a-9a6c-1a2b3c4d5e6f" }] } },
});

const CREATE_PROPOSAL = JSON.stringify({
  type: "npcs",
  attributes: { name: "Marcus", tldr: "A nerd with bouts of rage" },
  relationships: {
    related: [{ id: "042ec319-9d3c-4f0a-9a6c-1a2b3c4d5e6f", type: "npcs", label: "Zoe" }],
  },
});

function makeAction(overrides: Record<string, unknown> = {}) {
  return {
    id: "act-1",
    status: "pending",
    toolName: "create_entity",
    toolArgs: CREATE_TOOL_ARGS,
    proposal: CREATE_PROPOSAL,
    summary: 'Create a new npcs record named "Marcus".',
    ...overrides,
  } as any;
}

describe("ApprovalActionCard", () => {
  beforeEach(() => {
    for (const key of Object.keys(messages)) delete messages[key];
    findOne.mockReset();
    approve.mockReset();
    deny.mockReset();
  });

  it("renders the proposed record: the attributes and the related records by name", async () => {
    findOne.mockResolvedValue(makeAction());

    render(<ApprovalActionCard actionId="act-1" />);

    // summary still renders
    expect(await screen.findByText('Create a new npcs record named "Marcus".')).toBeInTheDocument();
    // attributes
    expect(await screen.findByText("Marcus")).toBeInTheDocument();
    expect(screen.getByText("A nerd with bouts of rage")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    // relationships: humanised key + the resolved display names, never ids
    expect(screen.getByText("Related")).toBeInTheDocument();
    expect(screen.getByText("Zoe")).toBeInTheDocument();
    expect(screen.queryByText(UUID_LIKE)).toBeNull();
    // buttons are actionable while the action is pending
    expect(screen.getByRole("button", { name: "features.assistant.approval.approve" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "features.assistant.approval.deny" })).toBeEnabled();
  });

  it("renders booleans as Yes/No and numbers as-is", async () => {
    findOne.mockResolvedValue(
      makeAction({
        proposal: JSON.stringify({
          type: "factions",
          attributes: { name: "The Cinder Pact", secret: true, rank: 3 },
        }),
      }),
    );

    render(<ApprovalActionCard actionId="act-1" />);

    expect(await screen.findByText("The Cinder Pact")).toBeInTheDocument();
    expect(screen.getByText("features.assistant.approval.proposal.yes")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders the plain text of a BlockNote document value", async () => {
    const document = JSON.stringify([
      { id: "1", type: "paragraph", content: [{ type: "text", text: "First line" }], children: [] },
      {
        id: "2",
        type: "paragraph",
        content: [
          { type: "text", text: "Second " },
          { type: "text", text: "line" },
        ],
      },
    ]);
    findOne.mockResolvedValue(
      makeAction({ proposal: JSON.stringify({ type: "npcs", attributes: { description: document } }) }),
    );

    render(<ApprovalActionCard actionId="act-1" />);

    // identity normalizer: the default one collapses the newline the reducer emits
    expect(await screen.findByText("First line\nSecond line", { normalizer: (text) => text })).toBeInTheDocument();
  });

  it("skips null, undefined and empty attribute rows", async () => {
    findOne.mockResolvedValue(
      makeAction({
        proposal: JSON.stringify({
          type: "npcs",
          attributes: { name: "Marcus", tldr: null, notes: "", tags: [] },
        }),
      }),
    );

    render(<ApprovalActionCard actionId="act-1" />);

    expect(await screen.findByText("Marcus")).toBeInTheDocument();
    expect(screen.queryByText("Tldr")).not.toBeInTheDocument();
    expect(screen.queryByText("Notes")).not.toBeInTheDocument();
    expect(screen.queryByText("Tags")).not.toBeInTheDocument();
  });

  it("shows the target record's name — never its id — for an update_entity proposal", async () => {
    findOne.mockResolvedValue(
      makeAction({
        toolName: "update_entity",
        summary: 'Update the npcs record "Marcus" (name).',
        toolArgs: JSON.stringify({
          type: "npcs",
          id: "npc-9d3c4f0a-1a2b-4c4d-9a6c-042ec3199d3c",
          attributes: { name: "Marcus the Calm" },
        }),
        proposal: JSON.stringify({
          type: "npcs",
          target: { id: "9d3c4f0a-1a2b-4c4d-9a6c-042ec3199d3c", type: "npcs", label: "Marcus" },
          attributes: { name: "Marcus the Calm" },
        }),
      }),
    );

    render(<ApprovalActionCard actionId="act-1" />);

    expect(await screen.findByText("features.assistant.approval.proposal.updateHeading")).toBeInTheDocument();
    expect(screen.getByText("Marcus")).toBeInTheDocument();
    expect(screen.getByText("Marcus the Calm")).toBeInTheDocument();
    expect(screen.queryByText(UUID_LIKE)).toBeNull();
  });

  it("shows the relationship name and the linked records for a link proposal", async () => {
    findOne.mockResolvedValue(
      makeAction({
        toolName: "link_entities",
        summary: 'Link "Zoe", "Bob" to the "related" relationship of the npcs record "Marcus".',
        proposal: JSON.stringify({
          type: "npcs",
          target: { id: "9d3c4f0a-1a2b-4c4d-9a6c-042ec3199d3c", type: "npcs", label: "Marcus" },
          relationship: "related",
          targets: [
            { id: "042ec319-9d3c-4f0a-9a6c-1a2b3c4d5e6f", type: "npcs", label: "Zoe" },
            { id: "c81d6ac7-1a2b-4c4d-9a6c-042ec3199d3c", type: "npcs", label: "Bob" },
          ],
        }),
      }),
    );

    render(<ApprovalActionCard actionId="act-1" />);

    expect(await screen.findByText("features.assistant.approval.proposal.relationship")).toBeInTheDocument();
    expect(screen.getByText("Related")).toBeInTheDocument();
    expect(screen.getByText("features.assistant.approval.proposal.records")).toBeInTheDocument();
    expect(screen.getByText("Zoe, Bob")).toBeInTheDocument();
    expect(screen.getByText("Marcus")).toBeInTheDocument();
    expect(screen.queryByText(UUID_LIKE)).toBeNull();
  });

  it("shows the unlinked records by name for an unlink proposal", async () => {
    findOne.mockResolvedValue(
      makeAction({
        toolName: "unlink_entities",
        summary: 'Unlink "Zoe" from the "related" relationship of the npcs record "Marcus".',
        proposal: JSON.stringify({
          type: "npcs",
          target: { id: "9d3c4f0a-1a2b-4c4d-9a6c-042ec3199d3c", type: "npcs", label: "Marcus" },
          relationship: "related",
          targets: [{ id: "042ec319-9d3c-4f0a-9a6c-1a2b3c4d5e6f", type: "npcs", label: "Zoe" }],
        }),
      }),
    );

    render(<ApprovalActionCard actionId="act-1" />);

    expect(await screen.findByText("Zoe")).toBeInTheDocument();
    expect(screen.getByText("features.assistant.approval.proposal.records")).toBeInTheDocument();
    expect(screen.queryByText(UUID_LIKE)).toBeNull();
  });

  it("hides the relationship rows named by hiddenRelationshipKeys, and shows them when it does not", async () => {
    // The write tools force the run's own scope and discard the model's, so
    // the host app hides that relationship rather than showing a record the
    // write may not even end up using.
    const proposal = JSON.stringify({
      type: "npcs",
      attributes: { name: "Marcus" },
      relationships: {
        campaign: [{ id: "c81d6ac7-1a2b-4c4d-9a6c-042ec3199d3c", type: "campaigns", label: "The Ashen Crown" }],
        related: [{ id: "042ec319-9d3c-4f0a-9a6c-1a2b3c4d5e6f", type: "npcs", label: "Zoe" }],
      },
    });
    findOne.mockResolvedValue(makeAction({ proposal }));

    const hidden = render(<ApprovalActionCard actionId="act-1" hiddenRelationshipKeys={["campaign"]} />);

    expect(await screen.findByText("Marcus")).toBeInTheDocument();
    expect(screen.queryByText("Campaign")).not.toBeInTheDocument();
    expect(screen.queryByText("The Ashen Crown")).not.toBeInTheDocument();
    // the relationships that are not listed keep rendering
    expect(screen.getByText("Related")).toBeInTheDocument();
    expect(screen.getByText("Zoe")).toBeInTheDocument();

    hidden.unmount();
    render(<ApprovalActionCard actionId="act-1" />);

    expect(await screen.findByText("Campaign")).toBeInTheDocument();
    expect(screen.getByText("The Ashen Crown")).toBeInTheDocument();
    expect(screen.queryByText(UUID_LIKE)).toBeNull();
  });

  it("falls back to the toolArgs attributes — and to no relationship rows — for a legacy action", async () => {
    findOne.mockResolvedValue(
      makeAction({
        proposal: "",
        toolArgs: JSON.stringify({
          type: "npcs",
          fields: { name: "Marcus", tldr: "A nerd with bouts of rage" },
          relationships: { related: { data: [{ type: "npcs", id: "042ec319-9d3c-4f0a-9a6c-1a2b3c4d5e6f" }] } },
        }),
      }),
    );

    render(<ApprovalActionCard actionId="act-1" />);

    // attributes still render (`fields` is the key the create_entity tool emits)
    expect(await screen.findByText("Marcus")).toBeInTheDocument();
    expect(screen.getByText("A nerd with bouts of rage")).toBeInTheDocument();
    // relationships from toolArgs carry ids only — no row, and no id on screen
    expect(screen.queryByText("Related")).not.toBeInTheDocument();
    expect(screen.queryByText(UUID_LIKE)).toBeNull();
  });

  it("labels fields with the entity editor's own message keys when the app defines them", async () => {
    Object.assign(messages, {
      "features.npc.fields.name.label": "Nome",
      "features.npc.fields.tldr.label": "Riassunto",
      "entities.npcs": "PNG",
    });
    findOne.mockResolvedValue(makeAction());

    render(<ApprovalActionCard actionId="act-1" />);

    expect(await screen.findByText("Nome")).toBeInTheDocument();
    expect(screen.getByText("Riassunto")).toBeInTheDocument();
    // `related` has no editor key and no generic key: humanised, as before
    expect(screen.getByText("Related")).toBeInTheDocument();
    expect(screen.queryByText("Name")).toBeNull();
    expect(screen.queryByText("Tldr")).toBeNull();
  });

  it("falls back to the generic ui.fields key, and finds editor keys for irregular plurals", async () => {
    Object.assign(messages, {
      "ui.fields.related": "Collegati",
      "features.knife.fields.name.label": "Nome del gancio",
    });
    findOne.mockResolvedValue(
      makeAction({
        proposal: JSON.stringify({
          type: "knives",
          attributes: { name: "The sister left behind", publicDescription: "Visible" },
          relationships: { related: [{ id: "r1", type: "npcs", label: "Zoe" }] },
        }),
      }),
    );

    render(<ApprovalActionCard actionId="act-1" />);

    expect(await screen.findByText("Nome del gancio")).toBeInTheDocument();
    expect(screen.getByText("Collegati")).toBeInTheDocument();
    // no key anywhere: the humanised attribute name, unchanged
    expect(screen.getByText("Public Description")).toBeInTheDocument();
  });

  it("translates the relationship name on a link proposal", async () => {
    Object.assign(messages, { "features.clue.fields.containedInScene.label": "Contenuto nella scena" });
    findOne.mockResolvedValue(
      makeAction({
        toolName: "link_entities",
        proposal: JSON.stringify({
          type: "clues",
          target: { id: "c1", type: "clues", label: "Bloody knife" },
          relationship: "containedInScene",
          targets: [{ id: "s1", type: "scenes", label: "The docks" }],
        }),
      }),
    );

    render(<ApprovalActionCard actionId="act-1" />);

    expect(await screen.findByText("Contenuto nella scena")).toBeInTheDocument();
    expect(screen.getByText("The docks")).toBeInTheDocument();
  });

  it("still renders the summary and the buttons when neither payload parses", async () => {
    findOne.mockResolvedValue(makeAction({ proposal: "{not-json", toolArgs: "{not-json" }));

    render(<ApprovalActionCard actionId="act-1" />);

    expect(await screen.findByText('Create a new npcs record named "Marcus".')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "features.assistant.approval.approve" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "features.assistant.approval.deny" })).toBeEnabled();
    expect(screen.queryByText("features.assistant.approval.proposal.heading")).not.toBeInTheDocument();
    expect(screen.queryByText(UUID_LIKE)).toBeNull();
  });
});

describe("ApprovalActionCard — editable create proposal", () => {
  const DESCRIPTION_BLOCKS = [
    { id: "b1", type: "paragraph", content: [{ type: "text", text: "Runs the docks" }], children: [] },
  ];

  const EDITABLE_PROPOSAL = JSON.stringify({
    type: "npcs",
    attributes: {
      name: "Marcus",
      tldr: "A nerd with bouts of rage",
      description: JSON.stringify(DESCRIPTION_BLOCKS),
      age: 42,
    },
    relationships: {
      related: [{ id: "042ec319-9d3c-4f0a-9a6c-1a2b3c4d5e6f", type: "npcs", label: "Zoe" }],
    },
    editable: { name: "text", tldr: "text", description: "richtext" },
  });

  const EDITOR_ID = "approval-act-1-description";
  const EDITED_BLOCKS = [
    { id: "b1", type: "paragraph", content: [{ type: "text", text: "Owns the docks" }], children: [] },
  ];

  const approveButton = () => screen.getByRole("button", { name: "features.assistant.approval.approve" });

  beforeEach(() => {
    for (const key of Object.keys(messages)) delete messages[key];
    for (const key of Object.keys(editors)) delete editors[key];
    findOne.mockReset();
    approve.mockReset();
    deny.mockReset();
  });

  it("renders the editable attributes as fields while pending, and the rest read-only", async () => {
    findOne.mockResolvedValue(makeAction({ proposal: EDITABLE_PROPOSAL }));

    render(<ApprovalActionCard actionId="act-1" />);

    const name = (await screen.findByTestId("approval-field-name")) as HTMLInputElement;
    expect(name.tagName).toBe("INPUT");
    expect(name.value).toBe("Marcus");
    expect(name).toHaveAttribute("aria-label", "Name");
    expect((screen.getByTestId("approval-field-tldr") as HTMLInputElement).value).toBe("A nerd with bouts of rage");
    // the rich text is the bordered editor, holding the proposed blocks
    expect(screen.getByTestId("approval-field-description")).toBeInTheDocument();
    expect(editors[EDITOR_ID].initialContent).toEqual(DESCRIPTION_BLOCKS);
    expect(editors[EDITOR_ID].bordered).toBe(true);
    // numbers and relationships stay read-only text
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Zoe")).toBeInTheDocument();
  });

  it("renders no field when the proposal has no editable map", async () => {
    findOne.mockResolvedValue(makeAction());

    render(<ApprovalActionCard actionId="act-1" />);

    expect(await screen.findByText("Marcus")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByTestId("approval-field-name")).toBeNull();
  });

  it("renders no field when the action is no longer pending", async () => {
    findOne.mockResolvedValue(makeAction({ status: "executed", proposal: EDITABLE_PROPOSAL }));

    render(<ApprovalActionCard actionId="act-1" />);

    expect(await screen.findByText("Marcus")).toBeInTheDocument();
    expect(screen.getByText("Runs the docks")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(Object.keys(editors)).toHaveLength(0);
  });

  it("keeps an update card read-only", async () => {
    findOne.mockResolvedValue(
      makeAction({
        toolName: "update_entity",
        proposal: JSON.stringify({
          type: "npcs",
          target: { id: "t1", type: "npcs", label: "Marcus" },
          attributes: { tldr: "Calmer now" },
        }),
      }),
    );

    render(<ApprovalActionCard actionId="act-1" />);

    expect(await screen.findByText("Calmer now")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("approves body-less when nothing was edited", async () => {
    findOne.mockResolvedValue(makeAction({ proposal: EDITABLE_PROPOSAL }));
    approve.mockResolvedValue(undefined);

    render(<ApprovalActionCard actionId="act-1" />);
    await screen.findByTestId("approval-field-name");

    fireEvent.click(approveButton());

    await waitFor(() => expect(approve).toHaveBeenCalledTimes(1));
    expect(approve).toHaveBeenCalledWith({ id: "act-1" });
  });

  it("approves with only the changed fields, the rich text as stringified blocks", async () => {
    findOne.mockResolvedValue(makeAction({ proposal: EDITABLE_PROPOSAL }));
    approve.mockResolvedValue(undefined);

    render(<ApprovalActionCard actionId="act-1" />);
    const name = await screen.findByTestId("approval-field-name");

    fireEvent.change(name, { target: { value: "Marco" } });
    act(() => editors[EDITOR_ID].onChange?.(EDITED_BLOCKS, false));
    fireEvent.click(approveButton());

    await waitFor(() => expect(approve).toHaveBeenCalledTimes(1));
    expect(approve).toHaveBeenCalledWith({
      id: "act-1",
      edits: { name: "Marco", description: JSON.stringify(EDITED_BLOCKS) },
    });
  });

  it("does not send a field typed back to its proposed value", async () => {
    findOne.mockResolvedValue(makeAction({ proposal: EDITABLE_PROPOSAL }));
    approve.mockResolvedValue(undefined);

    render(<ApprovalActionCard actionId="act-1" />);
    const name = await screen.findByTestId("approval-field-name");

    fireEvent.change(name, { target: { value: "Marco" } });
    fireEvent.change(name, { target: { value: "Marcus" } });
    fireEvent.click(approveButton());

    await waitFor(() => expect(approve).toHaveBeenCalledWith({ id: "act-1" }));
  });

  it("disables Approve while a proposed text or rich text is emptied, and enables it once refilled", async () => {
    findOne.mockResolvedValue(makeAction({ proposal: EDITABLE_PROPOSAL }));

    render(<ApprovalActionCard actionId="act-1" />);
    const name = await screen.findByTestId("approval-field-name");

    fireEvent.change(name, { target: { value: "   " } });
    expect(approveButton()).toBeDisabled();
    expect(screen.getByRole("button", { name: "features.assistant.approval.deny" })).toBeEnabled();
    fireEvent.change(name, { target: { value: "Marco" } });
    expect(approveButton()).toBeEnabled();

    act(() => editors[EDITOR_ID].onChange?.([{ type: "paragraph", content: [] }], true));
    expect(approveButton()).toBeDisabled();
    act(() => editors[EDITOR_ID].onChange?.(DESCRIPTION_BLOCKS, false));
    expect(approveButton()).toBeEnabled();
  });

  it("lets an originally empty editable field stay empty", async () => {
    findOne.mockResolvedValue(
      makeAction({
        proposal: JSON.stringify({
          type: "npcs",
          attributes: { name: "Marcus", tldr: "" },
          editable: { name: "text", tldr: "text" },
        }),
      }),
    );

    render(<ApprovalActionCard actionId="act-1" />);

    expect(await screen.findByTestId("approval-field-tldr")).toHaveValue("");
    expect(approveButton()).toBeEnabled();
  });

  it("edits a rich-text value that is not a BlockNote document as plain text", async () => {
    findOne.mockResolvedValue(
      makeAction({
        proposal: JSON.stringify({
          type: "npcs",
          attributes: { name: "Marcus", description: "Line one\nLine two" },
          editable: { description: "richtext" },
        }),
      }),
    );
    approve.mockResolvedValue(undefined);

    render(<ApprovalActionCard actionId="act-1" />);

    const box = (await screen.findByTestId("approval-field-description")) as HTMLTextAreaElement;
    expect(box.tagName).toBe("TEXTAREA");
    expect(box.value).toBe("Line one\nLine two");
    expect(Object.keys(editors)).toHaveLength(0);

    fireEvent.change(box, { target: { value: "Line one" } });
    fireEvent.click(approveButton());
    await waitFor(() => expect(approve).toHaveBeenCalledWith({ id: "act-1", edits: { description: "Line one" } }));
  });

  it("shows the saved values read-only with the status after an approve with edits", async () => {
    findOne.mockResolvedValue(makeAction({ proposal: EDITABLE_PROPOSAL }));
    approve.mockResolvedValue(undefined);

    render(<ApprovalActionCard actionId="act-1" />);
    const name = await screen.findByTestId("approval-field-name");
    fireEvent.change(name, { target: { value: "Marco" } });
    act(() => editors[EDITOR_ID].onChange?.(EDITED_BLOCKS, false));
    fireEvent.click(approveButton());

    expect(await screen.findByText("features.assistant.approval.status.executed")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByText("Marco")).toBeInTheDocument();
    expect(screen.getByText("Owns the docks")).toBeInTheDocument();
    expect(screen.getByText("A nerd with bouts of rage")).toBeInTheDocument();
    expect(screen.queryByText("Marcus")).toBeNull();
  });

  it("denies without sending the edits", async () => {
    findOne.mockResolvedValue(makeAction({ proposal: EDITABLE_PROPOSAL }));
    deny.mockResolvedValue(undefined);

    render(<ApprovalActionCard actionId="act-1" />);
    const name = await screen.findByTestId("approval-field-name");
    fireEvent.change(name, { target: { value: "Marco" } });
    fireEvent.click(screen.getByRole("button", { name: "features.assistant.approval.deny" }));

    await waitFor(() => expect(deny).toHaveBeenCalledWith({ id: "act-1" }));
    expect(approve).not.toHaveBeenCalled();
  });

  it("passes the mention props to the rich-text editor", async () => {
    findOne.mockResolvedValue(makeAction({ proposal: EDITABLE_PROPOSAL }));
    const mentionSearchFn = vi.fn();
    const mentionResolveFn = vi.fn();
    const mentionSearchParams = { campaignId: "c1" };

    render(
      <ApprovalActionCard
        actionId="act-1"
        mentionSearchFn={mentionSearchFn}
        mentionResolveFn={mentionResolveFn}
        mentionSearchParams={mentionSearchParams}
      />,
    );
    await screen.findByTestId("approval-field-description");

    expect(editors[EDITOR_ID]).toMatchObject({
      enableMentions: true,
      mentionSearchFn,
      mentionResolveFn,
      mentionSearchParams,
    });
  });
});
