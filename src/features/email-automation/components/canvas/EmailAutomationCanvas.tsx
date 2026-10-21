"use client";

import {
  Background,
  Connection,
  Edge,
  EdgeChange,
  FinalConnectionState,
  Node,
  NodeChange,
  OnConnectStart,
  OnNodeDrag,
  ReactFlow,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { errorToast } from "../../../../components/errors";
import { ConfirmDialog, ContextMenu, ContextMenuContent, ContextMenuItem } from "../../../../shadcnui";
import { useIsMobile } from "../../../../utils/use-mobile";
import { showError } from "../../../../utils/toast";
import { useEmailAutomation } from "../../contexts/EmailAutomationContext";
import { EmailAutomationEditor } from "../forms/EmailAutomationEditor";
import {
  STEP_NODE_HEIGHT,
  STEP_NODE_PREFIX,
  STEP_NODE_WIDTH,
  STEP_SOURCE_HANDLE_PREFIX,
  STEP_TARGET_HANDLE_PREFIX,
  TRIGGER_NODE_ID,
  TRIGGER_SOURCE_HANDLE,
  buildCanvasGraph,
} from "./buildCanvasGraph";
import { DelayEdge } from "./edges/DelayEdge";
import { EmailAutomationCanvasInspector, useUserClosedGuard } from "./EmailAutomationCanvasInspector";
import { EmailStepNode } from "./nodes/EmailStepNode";
import { TriggerNode } from "./nodes/TriggerNode";
import { CanvasToolbar, EmptyCanvas, createLongPressTracker } from "./shared";

const DEFAULT_DELAY_HOURS = 24;

type PendingPaneMenu = {
  flowX: number;
  flowY: number;
  screenX: number;
  screenY: number;
};

type PendingNodeMenu = {
  stepId: string;
  screenX: number;
  screenY: number;
};

const pointAnchor = (screenX: number, screenY: number) => ({
  getBoundingClientRect: () =>
    ({
      x: screenX,
      y: screenY,
      top: screenY,
      left: screenX,
      right: screenX,
      bottom: screenY,
      width: 0,
      height: 0,
      toJSON: () => ({}),
    }) as DOMRect,
});

const stepIdOf = (nodeId: string | null | undefined): string | null =>
  nodeId?.startsWith(STEP_NODE_PREFIX) ? nodeId.slice(STEP_NODE_PREFIX.length) : null;

export function EmailAutomationCanvas() {
  const { automation, steps, triggers, select, reload, createStep, deleteStep, setNext, updatePosition, tidy } =
    useEmailAutomation();
  const t = useTranslations();
  // Phone-only: a looser zoom-out floor so "Fit to view" can show the whole
  // graph. Desktop keeps React Flow's defaults untouched.
  const isMobile = useIsMobile();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const { screenToFlowPosition } = useReactFlow();
  const connectingFromRef = useRef<{ nodeId: string | null; handleId: string | null } | null>(null);
  const [paneMenu, setPaneMenu] = useState<PendingPaneMenu | null>(null);
  const [nodeMenu, setNodeMenu] = useState<PendingNodeMenu | null>(null);
  const [pendingDeleteStepId, setPendingDeleteStepId] = useState<string | null>(null);
  const [automationEditorOpen, setAutomationEditorOpen] = useState<boolean>(false);

  const triggerLabel = useMemo(
    () =>
      triggers.find((trigger) => trigger.key === automation?.trigger)?.label ?? t("emailAutomations.canvas.noTrigger"),
    [triggers, automation?.trigger, t],
  );

  const { laidNodes, laidEdges } = useMemo(() => {
    const graph = buildCanvasGraph(steps, triggerLabel);
    return { laidNodes: graph.nodes, laidEdges: graph.edges };
  }, [steps, triggerLabel]);

  useEffect(() => {
    setNodes(laidNodes);
    setEdges(laidEdges);
  }, [laidNodes, laidEdges]);

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  // The trigger has no stored position: only steps are persisted.
  const onNodeDragStop: OnNodeDrag = useCallback(
    (_e, node) => {
      const stepId = stepIdOf(node.id);
      if (!stepId) return;
      void updatePosition(stepId, node.position.x, node.position.y);
    },
    [updatePosition],
  );

  const onConnectStart: OnConnectStart = useCallback((_e, params) => {
    connectingFromRef.current = { nodeId: params.nodeId ?? null, handleId: params.handleId ?? null };
  }, []);

  /** A rejected link (self-link, loop, step already linked) reloads the true chain. */
  const linkSteps = useCallback(
    async (stepId: string, nextStepId: string) => {
      try {
        await setNext(stepId, nextStepId);
      } catch (error) {
        errorToast({ title: t("emailAutomations.canvas.chainError"), error });
        await reload();
      }
    },
    [setNext, reload, t],
  );

  // onConnect fires only when React Flow finds a valid target handle.
  const onConnect = useCallback(
    async (conn: Connection) => {
      const from = connectingFromRef.current;
      connectingFromRef.current = null;
      if (!from || !from.handleId) return;
      if (!conn.targetHandle?.startsWith(STEP_TARGET_HANDLE_PREFIX)) return;
      const targetStepId = conn.targetHandle.slice(STEP_TARGET_HANDLE_PREFIX.length);

      // The trigger→head link is not stored: the API derives the head as the
      // oldest step with no incoming NEXT. A drag from the trigger onto a step
      // therefore cannot be saved, so it is refused with the chain error and
      // nothing changes.
      if (from.handleId === TRIGGER_SOURCE_HANDLE) {
        showError(t("emailAutomations.canvas.chainError"));
        return;
      }

      if (!from.handleId.startsWith(STEP_SOURCE_HANDLE_PREFIX)) return;
      const sourceStepId = from.handleId.slice(STEP_SOURCE_HANDLE_PREFIX.length);
      await linkSteps(sourceStepId, targetStepId);
    },
    [linkSteps, t],
  );

  /** Creates a step centred on a flow point and returns its id. */
  const createStepAt = useCallback(
    async (flowX: number, flowY: number): Promise<string | null> => {
      if (!automation) return null;
      const id = uuidv4();
      await createStep({
        id,
        automationId: automation.id,
        subject: t("emailAutomations.step.title"),
        body: "",
        delayHours: DEFAULT_DELAY_HOURS,
        positionX: flowX - STEP_NODE_WIDTH / 2,
        positionY: flowY - STEP_NODE_HEIGHT / 2,
      });
      return id;
    },
    [automation, createStep, t],
  );

  // onConnectEnd fires for EVERY drag end. If onConnect already cleared the
  // ref, it handled the case. Otherwise a drop on empty canvas creates a new
  // step there: from a step it is linked as that step's next; from the
  // trigger it is simply the first step when none existed, otherwise an
  // orphan (the trigger→head link is derived, never stored).
  const onConnectEnd = useCallback(
    async (event: MouseEvent | TouchEvent, connectionState: FinalConnectionState) => {
      const from = connectingFromRef.current;
      if (!from || !from.handleId || !automation) return;
      connectingFromRef.current = null;
      // Dropped on a node but not on its handle: not an empty-canvas drop.
      if (connectionState.toNode) return;

      const clientX =
        "clientX" in event ? (event as MouseEvent).clientX : ((event as TouchEvent).changedTouches[0]?.clientX ?? 0);
      const clientY =
        "clientY" in event ? (event as MouseEvent).clientY : ((event as TouchEvent).changedTouches[0]?.clientY ?? 0);
      const flowPos = screenToFlowPosition({ x: clientX, y: clientY });

      const sourceStepId = from.handleId.startsWith(STEP_SOURCE_HANDLE_PREFIX)
        ? from.handleId.slice(STEP_SOURCE_HANDLE_PREFIX.length)
        : null;
      if (!sourceStepId && from.handleId !== TRIGGER_SOURCE_HANDLE) return;

      const newStepId = await createStepAt(flowPos.x, flowPos.y);
      if (!newStepId) return;
      if (sourceStepId) await linkSteps(sourceStepId, newStepId);
      select(newStepId);
    },
    [automation, screenToFlowPosition, createStepAt, linkSteps, select],
  );

  // --- Pane context menu ---

  const handlePaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      if (!automation) return;
      event.preventDefault();
      const clientX = (event as MouseEvent).clientX;
      const clientY = (event as MouseEvent).clientY;
      const flowPos = screenToFlowPosition({ x: clientX, y: clientY });
      setPaneMenu({
        flowX: flowPos.x,
        flowY: flowPos.y,
        screenX: clientX,
        screenY: clientY,
      });
    },
    [automation, screenToFlowPosition],
  );

  const handleCreateStepFromPane = useCallback(async () => {
    const menu = paneMenu;
    if (!menu) return;
    setPaneMenu(null);
    const newStepId = await createStepAt(menu.flowX, menu.flowY);
    if (newStepId) select(newStepId);
  }, [paneMenu, createStepAt, select]);

  // --- Node context menu ---
  //
  // Rendered through the same portal-based ContextMenu + fixed-anchor
  // technique as the pane menu: Base UI menus do NOT work when mounted inside
  // a React Flow node, so the menu lives outside the canvas and is anchored
  // to the click coordinates. The trigger node has no menu.
  const openNodeMenu = useCallback((nodeId: string | undefined, screenX: number, screenY: number) => {
    const stepId = stepIdOf(nodeId);
    if (!stepId) return;
    setNodeMenu({ stepId, screenX, screenY });
  }, []);

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      openNodeMenu(node.id, event.clientX, event.clientY);
    },
    [openNodeMenu],
  );

  // --- Touch: long-press a node opens the same node menu ---
  //
  // Touch screens have no right-click. A ~500ms finger hold on a step node
  // opens the menu at the finger; moving the finger (pan / node drag) cancels
  // it, and the click produced by lifting the finger is swallowed so the hold
  // does not also open the step editor.
  const openNodeMenuRef = useRef(openNodeMenu);
  openNodeMenuRef.current = openNodeMenu;
  const longPress = useMemo(
    () =>
      createLongPressTracker({
        onLongPress: ({ target, clientX, clientY }) => {
          openNodeMenuRef.current(target, clientX, clientY);
        },
      }),
    [],
  );
  useEffect(() => () => longPress.cancel(), [longPress]);

  const handleTouchPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (event.pointerType !== "touch") return;
      const el = event.target as Element | null;
      // A press on a connection handle starts a link drag, never a menu.
      if (!el || el.closest(".react-flow__handle")) return;
      const nodeId = el.closest(".react-flow__node")?.getAttribute("data-id");
      if (!stepIdOf(nodeId)) return;
      longPress.down(nodeId!, event.clientX, event.clientY);
    },
    [longPress],
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.id === TRIGGER_NODE_ID) {
        setAutomationEditorOpen(true);
        return;
      }
      const stepId = stepIdOf(node.id);
      if (stepId) select(stepId);
    },
    [select],
  );

  const handleDeleteStep = useCallback(async () => {
    const stepId = pendingDeleteStepId;
    if (!stepId) return;
    try {
      await deleteStep(stepId);
    } catch (error) {
      errorToast({ title: t("emailAutomations.canvas.deleteEmail"), error });
      throw error; // keeps the dialog open — ConfirmDialog swallows rejections
    }
  }, [pendingDeleteStepId, deleteStep, t]);

  const nodeTypes = useMemo(() => ({ triggerNode: TriggerNode, emailStepNode: EmailStepNode }), []);
  const edgeTypes = useMemo(() => ({ delayEdge: DelayEdge }), []);

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnectStart={onConnectStart}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onPaneContextMenu={handlePaneContextMenu}
        onNodeContextMenu={handleNodeContextMenu}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        // Built-in React Flow click handler — independent of EdgeLabelRenderer
        // pointer-events. The label button calls `select` too; either path
        // produces the same selection state.
        onEdgeClick={(_event, edge) => {
          const targetStepId = (edge.data as { targetStepId?: string } | undefined)?.targetStepId;
          if (targetStepId) select(targetStepId);
        }}
        fitView
        // Never zoom past 100% on fit: with no emails the trigger is the only
        // node, and the default ceiling (2x) blows it up over the empty state.
        fitViewOptions={{ maxZoom: 1 }}
        // React Flow's default floor is 0.5, which on a phone stops "Fit to
        // view" before the graph fits. undefined keeps the desktop default.
        minZoom={isMobile ? 0.15 : undefined}
        onPointerDownCapture={handleTouchPointerDown}
        onPointerMoveCapture={(event) => {
          if (event.pointerType === "touch") longPress.move(event.clientX, event.clientY);
        }}
        onPointerUpCapture={() => longPress.up()}
        onPointerCancelCapture={() => longPress.cancel()}
        onClickCapture={(event) => {
          if (!longPress.consumeClick()) return;
          event.preventDefault();
          event.stopPropagation();
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} />
      </ReactFlow>
      {steps.length === 0 && (
        // The canvas stays mounted under the empty state: the first email is
        // added by right-clicking it or dragging from the trigger.
        // Lower half only, so the text sits below the centred trigger node.
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2">
          <EmptyCanvas>
            <div className="flex flex-col gap-1">
              <span className="font-medium">{t("emailAutomations.canvas.emptyTitle")}</span>
              <span className="text-xs/relaxed">{t("emailAutomations.canvas.emptyBody")}</span>
            </div>
          </EmptyCanvas>
        </div>
      )}
      <CanvasToolbar onTidy={tidy} />
      <EmailAutomationCanvasInspector />
      {automationEditorOpen && automation && (
        <TriggerAutomationEditor
          automation={automation}
          onSaved={reload}
          onClose={() => setAutomationEditorOpen(false)}
        />
      )}
      <ConfirmDialog
        open={pendingDeleteStepId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteStepId(null);
        }}
        title={t("emailAutomations.canvas.deleteEmail")}
        description={t("emailAutomations.canvas.deleteEmailConfirm")}
        confirmLabel={t("emailAutomations.canvas.deleteEmail")}
        cancelLabel={t("ui.buttons.cancel")}
        destructive
        onConfirm={handleDeleteStep}
      />
      {paneMenu && (
        <ContextMenu
          open={true}
          onOpenChange={(open) => {
            if (!open) setPaneMenu(null);
          }}
        >
          <ContextMenuContent
            anchor={pointAnchor(paneMenu.screenX, paneMenu.screenY)}
            side="bottom"
            align="start"
            sideOffset={4}
          >
            <ContextMenuItem onClick={handleCreateStepFromPane}>
              <PlusIcon />
              {t("emailAutomations.canvas.addEmail")}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )}
      {nodeMenu && (
        <ContextMenu
          open={true}
          onOpenChange={(open) => {
            if (!open) setNodeMenu(null);
          }}
        >
          <ContextMenuContent
            anchor={pointAnchor(nodeMenu.screenX, nodeMenu.screenY)}
            side="bottom"
            align="start"
            sideOffset={4}
          >
            <ContextMenuItem
              onClick={() => {
                const menu = nodeMenu;
                setNodeMenu(null);
                if (menu) setPendingDeleteStepId(menu.stepId);
              }}
            >
              <Trash2Icon />
              {t("emailAutomations.canvas.deleteEmail")}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )}
    </>
  );
}

/**
 * The trigger node's click opens the automation's own EditorSheet, controlled
 * the same way the inspector controls the step editor.
 */
function TriggerAutomationEditor(props: {
  automation: NonNullable<ReturnType<typeof useEmailAutomation>["automation"]>;
  onSaved: () => Promise<void> | void;
  onClose: () => void;
}) {
  const onDialogOpenChange = useUserClosedGuard(props.onClose);

  return (
    <EmailAutomationEditor
      automation={props.automation}
      forceShow
      dialogOpen
      onDialogOpenChange={onDialogOpenChange}
      onSuccess={async () => {
        await props.onSaved();
        props.onClose();
      }}
    />
  );
}
