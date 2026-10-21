"use client";

import { useCallback, useMemo, useRef } from "react";
import { useEmailAutomation } from "../../contexts/EmailAutomationContext";
import { EmailStepEditor } from "../forms/EmailStepEditor";
import { findHeadStepId } from "./buildCanvasGraph";

/**
 * Mounts EmailStepEditor (the EditorSheet the step uses everywhere) on top of
 * the canvas, driven by `selectedStepId` from EmailAutomationContext. Copy of
 * the app's ScenarioCanvasInspector with one branch.
 *
 *  - We control open state via `forceShow + dialogOpen + onDialogOpenChange`.
 *  - On `onSuccess` we reload the canvas.
 *  - The step comes from the context's `steps` (already loaded for the
 *    canvas), so there is no per-step fetch.
 */
export function EmailAutomationCanvasInspector() {
  const { automation, steps, selectedStepId, select, reload } = useEmailAutomation();

  const close = useCallback(() => select(null), [select]);
  const onSaved = useCallback(async () => {
    await reload();
  }, [reload]);

  const headStepId = useMemo(() => findHeadStepId(steps), [steps]);
  const step = useMemo(() => steps.find((s) => s.id === selectedStepId) ?? null, [steps, selectedStepId]);

  if (!automation || !selectedStepId || !step) return null;

  return (
    <StepEditor
      key={step.id}
      step={step}
      automationId={automation.id}
      isHead={step.id === headStepId}
      onSaved={onSaved}
      onClose={close}
    />
  );
}

/**
 * Build an `onDialogOpenChange` callback that ignores the editor's
 * initial `open=false` notification. `useEditorDialog` (the hook
 * inside every EditorSheet) initialises `open` to `false`, then in
 * an effect sets it to `dialogOpen` (true). The "open=false" effect
 * fires synchronously on mount and would otherwise wipe our canvas
 * selection before the editor ever paints.
 */
export function useUserClosedGuard(onClose: () => void) {
  const wasOpenRef = useRef(false);
  return useCallback(
    (open: boolean) => {
      if (open) {
        wasOpenRef.current = true;
        return;
      }
      // open === false; only treat as "user closed" once we've seen open=true.
      if (wasOpenRef.current) onClose();
    },
    [onClose],
  );
}

function StepEditor(props: {
  step: ReturnType<typeof useEmailAutomation>["steps"][number];
  automationId: string;
  isHead: boolean;
  onSaved: () => Promise<void>;
  onClose: () => void;
}) {
  const onDialogOpenChange = useUserClosedGuard(props.onClose);

  return (
    <EmailStepEditor
      step={props.step}
      automationId={props.automationId}
      isHead={props.isHead}
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
