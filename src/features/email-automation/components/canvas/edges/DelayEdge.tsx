"use client";

import { BaseEdge, Edge, EdgeLabelRenderer, EdgeProps, getBezierPath } from "@xyflow/react";
import { useEmailAutomation } from "../../../contexts/EmailAutomationContext";
import { DelayEdgeData } from "../buildCanvasGraph";

type DelayEdgeType = Edge<DelayEdgeData>;

/**
 * ClueEdge recipe: a bezier with a label chip at its midpoint. The chip shows
 * the target step's delay and opens that step's editor. It is a plain
 * <button>: Base UI popovers do not work inside the React Flow canvas.
 */
export function DelayEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  data,
}: EdgeProps<DelayEdgeType>) {
  const { select } = useEmailAutomation();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const targetStepId = data?.targetStepId;

  return (
    <>
      <BaseEdge id={id} path={edgePath} className="stroke-foreground/60" interactionWidth={24} />
      <EdgeLabelRenderer>
        {/* Inline position + pointer-events per React Flow docs: the label
            portal sets pointer-events:none, so the label sets it back to
            'all' and carries `nodrag nopan nowheel` for event isolation. */}
        <div
          className="nodrag nopan nowheel"
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
            zIndex: 1000,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="nodrag nopan bg-background hover:bg-accent text-foreground border-border h-auto rounded border px-2 py-1 text-xs tabular-nums shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              if (targetStepId) select(targetStepId);
            }}
          >
            {label}
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
