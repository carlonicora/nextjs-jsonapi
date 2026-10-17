import { render, screen } from "@testing-library/react";
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
