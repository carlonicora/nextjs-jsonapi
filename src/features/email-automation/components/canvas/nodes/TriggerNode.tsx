"use client";

import { Handle, Node, NodeProps, Position } from "@xyflow/react";
import { ZapIcon } from "lucide-react";
import { TRIGGER_SOURCE_HANDLE, TriggerNodeData } from "../buildCanvasGraph";

// React Flow v12 requires the Node generic to carry the data shape.
type TriggerNodeType = Node<{ data: TriggerNodeData }>;

/**
 * The fixed head of the chain (SecretTargetNode recipe). Source handle only:
 * people enter here. Plain element, no Base UI inside the node; the click that
 * opens EmailAutomationEditor is handled by the canvas (`onNodeClick`).
 */
export function TriggerNode({ data }: NodeProps<TriggerNodeType>) {
  return (
    <div className="bg-foreground text-background flex w-[200px] cursor-pointer items-center justify-center gap-1 rounded-full px-4 py-2 text-center shadow-md">
      <ZapIcon className="size-3 shrink-0 opacity-60" />
      <div className="truncate text-sm font-medium">{data.data.label}</div>
      <Handle type="source" position={Position.Right} id={TRIGGER_SOURCE_HANDLE} />
    </div>
  );
}
