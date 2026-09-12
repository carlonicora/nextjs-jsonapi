"use client";

import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { Fragment, useEffect, useMemo, useState } from "react";
import { MicroLabel } from "../../../components/typography";
import { Badge, Button } from "../../../shadcnui";
import type { AssistantMessageInterface } from "../../assistant-message/data/AssistantMessageInterface";
import type { AssistantActionStatus } from "../data/AssistantActionInterface";
import { AssistantActionService } from "../data/AssistantActionService";

/**
 * Status pill variants. Soft `Badge` variants only — a hand-rolled
 * `bg-*-100 text-*-800` span is never a status pill (typography rule 8).
 */
const STATUS_VARIANT: Record<AssistantActionStatus, "softBlue" | "softGreen" | "softRed" | "softGray"> = {
  pending: "softBlue",
  approved: "softBlue",
  executed: "softGreen",
  denied: "softRed",
  failed: "softRed",
  expired: "softGray",
};

/**
 * Literal i18n keys (not a template literal) so the key set stays greppable
 * and every one of them can be verified against the app's messages file.
 */
const STATUS_LABEL_KEY: Record<AssistantActionStatus, string> = {
  pending: "features.assistant.approval.status.pending",
  approved: "features.assistant.approval.status.approved",
  executed: "features.assistant.approval.status.executed",
  denied: "features.assistant.approval.status.denied",
  failed: "features.assistant.approval.status.failed",
  expired: "features.assistant.approval.status.expired",
};

/**
 * One referenced record, already resolved to a display name by the API.
 * `id` exists for React keys only — it is NEVER rendered.
 */
interface ProposalRef {
  id: string;
  type: string;
  label: string;
}

/**
 * The operator's presentation payload (`AssistantAction.proposal`). Every
 * referenced record arrives resolved to a name, so the card never has to show
 * an id — an unknown or out-of-scope record is resolved to "(not found)" by
 * the API.
 */
interface OperatorActionProposal {
  /** JSON:API type of the record being written. */
  type: string;
  /** update / delete / link / unlink: the target record. Absent on create. */
  target?: ProposalRef;
  /** create / update: the field values being written. */
  attributes?: Record<string, unknown>;
  /** create: related records, resolved. The run's scope relationship is stripped by the API. */
  relationships?: Record<string, ProposalRef[]>;
  /** link / unlink: the relationship name… */
  relationship?: string;
  /** …and the records being linked or unlinked. */
  targets?: ProposalRef[];
}

/**
 * A parsed `toolArgs` payload, used only as the legacy fallback for actions
 * created before `proposal` existed.
 *
 * NOTE on the key name: `create_entity` / `update_entity` declare the field
 * values under `fields` (see `agents/operator/tools/entity-write.tools.ts`),
 * while other producers use the JSON:API-shaped `attributes`. Both are read so
 * the card never silently degrades to the bare summary. Relationships are NOT
 * read from here: `toolArgs` carries ids only, and no id is ever rendered.
 */
interface LegacyProposal {
  type: string;
  attributes: Record<string, unknown>;
}

interface ProposalRow {
  key: string;
  label: string;
  value: string;
}

/**
 * Entity label from a JSON:API type: drop a trailing "s", upper-case the first
 * letter. Short types (three letters or fewer after singularising) are
 * acronyms in this domain — "npcs" → "NPC", "pcs" → "PC" — so they are
 * upper-cased whole.
 */
function humaniseType(type: string): string {
  const singular = type.endsWith("s") ? type.slice(0, -1) : type;
  if (singular.length <= 3) return singular.toUpperCase();
  return singular.charAt(0).toUpperCase() + singular.slice(1);
}

/** `tldr` → `Tldr`, `publicDescription` → `Public description`. */
function humaniseKey(key: string): string {
  const words = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Plain text of a BlockNote document, without importing BlockNote: walk the
 * blocks, concatenate the text runs of each block's `content`, recurse into
 * `children`, and join the blocks with newlines.
 */
function blockNoteText(blocks: unknown[]): string {
  const lines: string[] = [];
  const walk = (nodes: unknown[]) => {
    for (const node of nodes) {
      if (!node || typeof node !== "object") continue;
      const block = node as { content?: unknown; children?: unknown };
      const runs = Array.isArray(block.content)
        ? block.content
            .map((run) =>
              run && typeof run === "object" && typeof (run as { text?: unknown }).text === "string"
                ? (run as { text: string }).text
                : "",
            )
            .join("")
        : "";
      if (runs.trim()) lines.push(runs);
      if (Array.isArray(block.children)) walk(block.children);
    }
  };
  walk(blocks);
  return lines.join("\n");
}

/** Returns the blocks when `value` parses as a BlockNote document (an array of `{ type }` blocks). */
function asBlockNoteDocument(value: string): unknown[] | undefined {
  if (!value.trimStart().startsWith("[")) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length === 0) return undefined;
    const everyBlock = parsed.every(
      (block) => !!block && typeof block === "object" && typeof (block as { type?: unknown }).type === "string",
    );
    return everyBlock ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/** Renders one attribute value as text. `undefined` means "skip this row". */
function formatAttribute(value: unknown, yes: string, no: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "boolean") return value ? yes : no;
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : undefined;
  if (Array.isArray(value)) {
    const joined = value
      .map((entry) =>
        entry === null || entry === undefined ? "" : typeof entry === "object" ? JSON.stringify(entry) : String(entry),
      )
      .filter((entry) => entry !== "")
      .join(", ");
    return joined === "" ? undefined : joined;
  }
  if (typeof value === "string") {
    if (value.trim() === "") return undefined;
    const document = asBlockNoteDocument(value);
    if (!document) return value;
    const text = blockNoteText(document);
    return text.trim() === "" ? undefined : text;
  }
  if (typeof value === "object") {
    const serialised = JSON.stringify(value);
    return serialised === "{}" ? undefined : serialised;
  }
  return undefined;
}

/** Joins the display names of resolved records. `undefined` means "skip this row". */
function formatRefs(refs: ProposalRef[]): string | undefined {
  const labels = refs.map((ref) => ref.label).filter((label) => label.trim() !== "");
  return labels.length ? labels.join(", ") : undefined;
}

/** A `{ id, type, label }` record, or `undefined` when the entry is not one. */
function asRef(value: unknown): ProposalRef | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const { id, type, label } = value as { id?: unknown; type?: unknown; label?: unknown };
  if (typeof label !== "string") return undefined;
  return {
    id: typeof id === "string" ? id : "",
    type: typeof type === "string" ? type : "",
    label,
  };
}

function asRefs(value: unknown): ProposalRef[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const ref = asRef(entry);
    return ref ? [ref] : [];
  });
}

/**
 * Parses the action's `proposal` — the API's presentation payload, where every
 * referenced record already carries its display name. Returns `undefined` when
 * the payload is absent or unparseable, so the card can fall back to the
 * legacy `toolArgs` attributes.
 */
function parseOperatorProposal(proposal: string | undefined): OperatorActionProposal | undefined {
  if (!proposal) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(proposal);
  } catch {
    return undefined;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;

  const payload = parsed as Record<string, unknown>;
  const attributes =
    payload.attributes && typeof payload.attributes === "object" && !Array.isArray(payload.attributes)
      ? (payload.attributes as Record<string, unknown>)
      : undefined;

  const relationships: Record<string, ProposalRef[]> = {};
  if (payload.relationships && typeof payload.relationships === "object" && !Array.isArray(payload.relationships)) {
    for (const [key, value] of Object.entries(payload.relationships as Record<string, unknown>)) {
      relationships[key] = asRefs(value);
    }
  }

  return {
    type: typeof payload.type === "string" ? payload.type : "",
    target: asRef(payload.target),
    attributes,
    relationships,
    relationship: typeof payload.relationship === "string" ? payload.relationship : undefined,
    targets: asRefs(payload.targets),
  };
}

/**
 * Legacy fallback for actions created before `proposal` existed: parses the
 * field values out of `toolArgs`. Returns `undefined` whenever the payload is
 * absent, unparseable or carries no field values — the card then falls back to
 * the summary alone, which must always still render with its buttons.
 *
 * Relationships are deliberately ignored here: `toolArgs` names them by id
 * only, and an id must never reach the screen.
 */
function parseLegacyProposal(toolArgs: string | undefined): LegacyProposal | undefined {
  if (!toolArgs) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(toolArgs);
  } catch {
    return undefined;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;

  const payload = parsed as Record<string, unknown>;
  const attributes = payload.attributes ?? payload.fields;
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) return undefined;

  return {
    type: typeof payload.type === "string" ? payload.type : "",
    attributes: attributes as Record<string, unknown>,
  };
}

interface Props {
  /** Id of the pending AssistantAction linked to the approval-request message. */
  actionId: string;
  /** Human-readable summary fallback (the approval-request message content). */
  summary?: string;
  /**
   * Relationship keys from the proposal that must not be rendered as rows.
   *
   * The write tools discard the model's scope relationship and force the run's
   * own scope, so showing it is noise at best and wrong at worst (the proposal
   * may name a different record than the one that will actually be written).
   * The host app names the keys it forces — e.g. `["campaign"]`.
   */
  hiddenRelationshipKeys?: string[];
  /** Invoked with the resumed assistant message returned by approve/deny. */
  onResolved?: (message: AssistantMessageInterface) => void;
}

/**
 * Renders an `approval-request` assistant message as an action card:
 * the destructive-tool summary, the proposed record (what the assistant wants
 * to write), plus Approve / Deny buttons. Buttons are only actionable while the
 * underlying AssistantAction is `pending`.
 *
 * NOTE: plain `<Button>` elements on purpose — never wrapped inside any
 * Base UI trigger component (no nested buttons, no `asChild`).
 */
export function ApprovalActionCard({ actionId, summary, onResolved, hiddenRelationshipKeys }: Props) {
  const t = useTranslations();
  const [status, setStatus] = useState<AssistantActionStatus | undefined>(undefined);
  const [actionSummary, setActionSummary] = useState<string | undefined>(undefined);
  const [toolName, setToolName] = useState<string | undefined>(undefined);
  const [toolArgs, setToolArgs] = useState<string | undefined>(undefined);
  const [actionProposal, setActionProposal] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const action = await AssistantActionService.findOne({ id: actionId });
        if (cancelled || !action) return;
        setStatus(action.status);
        setActionSummary(action.summary);
        setToolName(action.toolName);
        setToolArgs(action.toolArgs);
        setActionProposal(action.proposal);
      } catch (error) {
        console.error(`ApprovalActionCard: failed to fetch assistant action ${actionId}`, error);
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [actionId]);

  // The API's resolved payload wins; `toolArgs` is only the legacy fallback
  // (attributes alone — it names related records by id, which is never shown).
  const presented = useMemo(() => parseOperatorProposal(actionProposal), [actionProposal]);
  const legacy = useMemo(() => (presented ? undefined : parseLegacyProposal(toolArgs)), [presented, toolArgs]);
  const isUpdate = toolName === "update_entity";
  const entityLabel = humaniseType(presented?.type ?? legacy?.type ?? "");
  const targetLabel = presented?.target?.label ?? "";

  const rows = useMemo<ProposalRow[]>(() => {
    const yes = t("features.assistant.approval.proposal.yes");
    const no = t("features.assistant.approval.proposal.no");
    const attributes = presented?.attributes ?? legacy?.attributes;
    const attributeRows = Object.entries(attributes ?? {}).flatMap<ProposalRow>(([key, value]) => {
      const text = formatAttribute(value, yes, no);
      return text === undefined ? [] : [{ key: `attribute:${key}`, label: humaniseKey(key), value: text }];
    });
    if (!presented) return attributeRows;

    const hidden = new Set(hiddenRelationshipKeys ?? []);
    const relationshipRows = Object.entries(presented.relationships ?? {}).flatMap<ProposalRow>(([key, refs]) => {
      if (hidden.has(key)) return [];
      const text = formatRefs(refs);
      return text === undefined ? [] : [{ key: `relationship:${key}`, label: humaniseKey(key), value: text }];
    });

    const linkRows: ProposalRow[] = [];
    if (presented.relationship) {
      linkRows.push({
        key: "link:relationship",
        label: t("features.assistant.approval.proposal.relationship"),
        value: humaniseKey(presented.relationship),
      });
    }
    const targetsText = formatRefs(presented.targets ?? []);
    if (targetsText !== undefined) {
      linkRows.push({
        key: "link:records",
        label: t("features.assistant.approval.proposal.records"),
        value: targetsText,
      });
    }

    return [...attributeRows, ...relationshipRows, ...linkRows];
  }, [presented, legacy, t, hiddenRelationshipKeys]);

  const hasProposal = rows.length > 0;

  const actionable = status === "pending" && !busy && !failed;

  const resolve = async (kind: "approve" | "deny") => {
    if (!actionable) return;
    setBusy(true);
    try {
      const message =
        kind === "approve"
          ? await AssistantActionService.approve({ id: actionId })
          : await AssistantActionService.deny({ id: actionId });
      setStatus(kind === "approve" ? "executed" : "denied");
      if (message) onResolved?.(message);
    } catch (error) {
      console.error(`ApprovalActionCard: failed to ${kind} assistant action ${actionId}`, error);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-border bg-muted/30 flex flex-col gap-2 rounded-xl border p-3.5">
      <MicroLabel className="flex items-center gap-2">
        <ShieldAlert className="text-warning h-3.5 w-3.5" />
        <span>{t("features.assistant.approval.title")}</span>
        {status && status !== "pending" && (
          <Badge variant={STATUS_VARIANT[status]} className="ms-auto tracking-normal normal-case">
            {t(STATUS_LABEL_KEY[status])}
          </Badge>
        )}
      </MicroLabel>
      <div className="text-foreground text-sm leading-relaxed">{actionSummary ?? summary}</div>
      {hasProposal && (
        <div className="border-border/60 flex flex-col gap-2 rounded-lg border border-dashed p-3">
          <MicroLabel className="text-muted-foreground flex flex-wrap items-baseline gap-x-2">
            <span>
              {isUpdate
                ? t("features.assistant.approval.proposal.updateHeading", { entity: entityLabel })
                : t("features.assistant.approval.proposal.heading", { entity: entityLabel })}
            </span>
            {targetLabel !== "" && <span className="text-foreground tracking-normal normal-case">{targetLabel}</span>}
          </MicroLabel>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
            {rows.map((row) => (
              <Fragment key={row.key}>
                <dt className="text-muted-foreground text-xs leading-relaxed break-words sm:text-sm">{row.label}</dt>
                <dd className="text-foreground text-sm leading-relaxed break-words whitespace-pre-wrap">{row.value}</dd>
              </Fragment>
            ))}
          </dl>
        </div>
      )}
      {failed && (
        <div role="alert" className="text-destructive text-xs/relaxed">
          {t("features.assistant.approval.error")}
        </div>
      )}
      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" disabled={!actionable} onClick={() => void resolve("approve")}>
          {t("features.assistant.approval.approve")}
        </Button>
        <Button size="sm" variant="outline" disabled={!actionable} onClick={() => void resolve("deny")}>
          {t("features.assistant.approval.deny")}
        </Button>
      </div>
    </div>
  );
}
