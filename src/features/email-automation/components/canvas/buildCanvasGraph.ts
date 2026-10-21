import type { Edge, Node } from "@xyflow/react";
import { autoLayout, LayoutEdge, LayoutNode } from "./shared";

export const TRIGGER_NODE_ID = "trigger";
export const TRIGGER_SOURCE_HANDLE = "trigger-source";
export const STEP_NODE_PREFIX = "step:";
export const STEP_SOURCE_HANDLE_PREFIX = "step-source-";
export const STEP_TARGET_HANDLE_PREFIX = "step-target-";

export const TRIGGER_NODE_WIDTH = 200;
export const TRIGGER_NODE_HEIGHT = 56;
export const STEP_NODE_WIDTH = 200;
export const STEP_NODE_HEIGHT = 72;

/**
 * The fields the canvas reads from a step. `EmailAutomationStepInterface`
 * satisfies it structurally; the narrow shape keeps this function pure and
 * testable with plain objects.
 */
export type CanvasStep = {
  id: string;
  subject: string;
  delayHours: number;
  positionX?: number;
  positionY?: number;
  sentCount: number;
  next?: { id: string };
};

export type TriggerNodeData = { label: string };

export type EmailStepNodeData = {
  stepId: string;
  subject: string;
  sentCount: number;
  orphan: boolean;
  manuallyPositioned: boolean;
};

export type DelayEdgeData = { targetStepId: string; delayHours: number };

export type CanvasGraph = { nodes: Node[]; edges: Edge[]; orphanIds: string[] };

/**
 * The head is the oldest step with no incoming NEXT, exactly as the API picks
 * it (`findHead`). `steps` arrive ordered by createdAt ASC from
 * `findByAutomation`, so the first step nobody points at is the head.
 */
export function findHeadStepId(steps: CanvasStep[]): string | null {
  const pointedAt = new Set(steps.map((s) => s.next?.id).filter((id): id is string => !!id));
  return steps.find((s) => !pointedAt.has(s.id))?.id ?? null;
}

const stepNodeId = (stepId: string) => `${STEP_NODE_PREFIX}${stepId}`;

/**
 * Turns the automation's steps into React Flow nodes and edges: the trigger
 * node, one node per step, a trigger→head edge, and one edge per NEXT link.
 * Steps not reachable from the head (walking next→next) are orphans: they
 * never send and render dashed.
 */
export function buildCanvasGraph(steps: CanvasStep[], triggerLabel: string): CanvasGraph {
  const byId = new Map(steps.map((s) => [s.id, s]));
  const headId = findHeadStepId(steps);

  const chain = new Set<string>();
  let cursor = headId ? byId.get(headId) : undefined;
  while (cursor && !chain.has(cursor.id)) {
    chain.add(cursor.id);
    cursor = cursor.next ? byId.get(cursor.next.id) : undefined;
  }
  const orphanIds = steps.filter((s) => !chain.has(s.id)).map((s) => s.id);

  const layoutNodes: LayoutNode[] = [
    { id: TRIGGER_NODE_ID, width: TRIGGER_NODE_WIDTH, height: TRIGGER_NODE_HEIGHT, manuallyPositioned: false },
    ...steps.map((s) => ({
      id: stepNodeId(s.id),
      width: STEP_NODE_WIDTH,
      height: STEP_NODE_HEIGHT,
      manuallyPositioned: typeof s.positionX === "number" && typeof s.positionY === "number",
      x: s.positionX,
      y: s.positionY,
    })),
  ];

  const edges: Edge[] = [];
  const layoutEdges: LayoutEdge[] = [];

  const pushEdge = (source: string, sourceHandle: string, target: CanvasStep) => {
    const data: DelayEdgeData = { targetStepId: target.id, delayHours: target.delayHours };
    edges.push({
      id: `next:${source}->${target.id}`,
      source,
      sourceHandle,
      target: stepNodeId(target.id),
      targetHandle: `${STEP_TARGET_HANDLE_PREFIX}${target.id}`,
      type: "delayEdge",
      label: `${target.delayHours}h`,
      data,
    });
    layoutEdges.push({ source, target: stepNodeId(target.id) });
  };

  const head = headId ? byId.get(headId) : undefined;
  if (head) pushEdge(TRIGGER_NODE_ID, TRIGGER_SOURCE_HANDLE, head);
  for (const s of steps) {
    const next = s.next ? byId.get(s.next.id) : undefined;
    if (next) pushEdge(stepNodeId(s.id), `${STEP_SOURCE_HANDLE_PREFIX}${s.id}`, next);
  }

  const positions = autoLayout(layoutNodes, layoutEdges);

  const nodes: Node[] = [
    {
      id: TRIGGER_NODE_ID,
      type: "triggerNode",
      position: positions[TRIGGER_NODE_ID],
      deletable: false,
      data: { data: { label: triggerLabel } satisfies TriggerNodeData },
    },
    ...steps.map((s) => {
      const id = stepNodeId(s.id);
      return {
        id,
        type: "emailStepNode",
        position: positions[id],
        data: {
          data: {
            stepId: s.id,
            subject: s.subject,
            sentCount: s.sentCount,
            orphan: !chain.has(s.id),
            manuallyPositioned: typeof s.positionX === "number" && typeof s.positionY === "number",
          } satisfies EmailStepNodeData,
        },
      } satisfies Node;
    }),
  ];

  return { nodes, edges, orphanIds };
}
