"use client";

import { Handle, Node, NodeProps, Position } from "@xyflow/react";
import { MailIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { EmailStepNodeData, STEP_SOURCE_HANDLE_PREFIX, STEP_TARGET_HANDLE_PREFIX } from "../buildCanvasGraph";

type EmailStepNodeType = Node<{ data: EmailStepNodeData }>;

/**
 * 200px card (SceneNode recipe): subject bold, "sent N" muted. An orphan (not
 * reachable from the trigger, so it never sends) is the dashed, faded variant
 * with a caption. Plain elements only: Base UI menus/popovers do not work
 * inside React Flow nodes; clicks and context menus are handled by the canvas.
 */
export function EmailStepNode({ data }: NodeProps<EmailStepNodeType>) {
  const d = data.data;
  const t = useTranslations();

  const shellClass = d.orphan
    ? "border border-dashed border-foreground/30 bg-muted/40 opacity-60"
    : "border bg-background border-foreground/25 text-foreground";

  return (
    <div className={`w-[200px] cursor-pointer rounded-md p-2 shadow-sm ${shellClass}`}>
      <Handle type="target" position={Position.Left} id={`${STEP_TARGET_HANDLE_PREFIX}${d.stepId}`} />
      <Handle type="source" position={Position.Right} id={`${STEP_SOURCE_HANDLE_PREFIX}${d.stepId}`} />

      <div className="flex items-center gap-1 text-sm font-medium">
        <MailIcon className="size-3 shrink-0" />
        <span className="truncate">{d.subject}</span>
      </div>

      <div className="text-muted-foreground mt-1 text-xs tabular-nums">
        {t("emailAutomations.canvas.sent", { count: d.sentCount })}
      </div>

      {d.orphan && (
        <div className="text-muted-foreground mt-1 text-xs italic">{t("emailAutomations.canvas.orphan")}</div>
      )}
    </div>
  );
}
