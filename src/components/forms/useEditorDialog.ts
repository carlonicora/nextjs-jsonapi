"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Every OPEN editor dialog, in the order it opened — the last entry is the
// topmost. Escape has to consult this because each open dialog attaches its own
// `keydown` listener to `document`: listeners on the SAME node all run
// regardless of stopPropagation() (only stopImmediatePropagation() would stop
// them, and that would close the wrong one — the parent registers first). So
// without this stack a single Escape closes a nested create dialog AND the
// editor that opened it.
const openEditorStack: object[] = [];

type UseEditorDialogOptions = {
  dialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
  forceShow?: boolean;
  onClose?: () => void;
};

type UseEditorDialogReturn = {
  open: boolean;
  setOpen: (open: boolean) => void;
  handleOpenChange: (nextOpen: boolean) => void;
  discardDialogProps: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDiscard: () => void;
  };
};

export function useEditorDialog(isFormDirty: () => boolean, options?: UseEditorDialogOptions): UseEditorDialogReturn {
  const [open, setOpen] = useState<boolean>(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState<boolean>(false);

  // Marks that the pending `open` change originated FROM the dialogOpen prop
  // (the sync effect below), so the notify effect must not echo it back to the
  // parent. Without this guard the two effects form an unguarded two-way
  // binding: on mount `open` (false) and `dialogOpen` (true) disagree, so one
  // effect pushes open→parent while the other pulls parent→open, and they chase
  // each other every render → "Maximum update depth exceeded".
  const syncingFromProp = useRef(false);

  // Sync open state from external dialogOpen prop.
  // `open` is intentionally NOT a dependency: this effect must run only when the
  // prop changes. Adding `open` would re-fire on internal closes and immediately
  // re-open the dialog (dialogOpen still true while open just went false).
  useEffect(() => {
    if (options?.dialogOpen !== undefined && options.dialogOpen !== open) {
      syncingFromProp.current = true;
      setOpen(options.dialogOpen);
    }
  }, [options?.dialogOpen]);

  // Keep the latest onDialogOpenChange in a ref so the notify effect can read it
  // at fire time WITHOUT depending on its identity. If it were a dependency, a
  // consumer passing an inline (unmemoised) callback would make the effect
  // re-run every render and re-emit the CURRENT `open` value — e.g. a closed
  // EditorSheet spamming onDialogOpenChange(false). That corrupts parents that
  // multiplex several dialogs through one piece of state (the stray `false`
  // clears whichever dialog is actually open).
  const onDialogOpenChangeRef = useRef(options?.onDialogOpenChange);
  onDialogOpenChangeRef.current = options?.onDialogOpenChange;

  // Notify parent when open state changes — but skip the echo when this change
  // was driven by the dialogOpen prop above (otherwise it ping-pongs). Depends
  // ONLY on `open`, so it fires on real open changes, never on callback identity.
  useEffect(() => {
    if (syncingFromProp.current) {
      syncingFromProp.current = false;
      return;
    }
    onDialogOpenChangeRef.current?.(open);
  }, [open]);

  // Force show
  useEffect(() => {
    if (options?.forceShow) setOpen(true);
  }, [options?.forceShow]);

  // Call onClose when dialog closes
  useEffect(() => {
    if (!open) {
      if (options?.onClose) options.onClose();
    }
  }, [open]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && isFormDirty()) {
        setShowDiscardConfirm(true);
        return;
      }
      setOpen(nextOpen);
    },
    [isFormDirty],
  );

  // Identity of this dialog within `openEditorStack`.
  const dialogId = useRef<object>({});

  // Join the stack while open. The cleanup also covers unmount-while-open, so a
  // dialog whose parent stops rendering it cannot strand Escape at the top.
  useEffect(() => {
    if (!open) return;
    const id = dialogId.current;
    openEditorStack.push(id);
    return () => {
      const index = openEditorStack.lastIndexOf(id);
      if (index !== -1) openEditorStack.splice(index, 1);
    };
  }, [open]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        if (openEditorStack[openEditorStack.length - 1] !== dialogId.current) return;
        event.preventDefault();
        event.stopPropagation();
        handleOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown, true);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [open, handleOpenChange]);

  const discardDialogProps = {
    open: showDiscardConfirm,
    onOpenChange: setShowDiscardConfirm,
    onDiscard: () => {
      setShowDiscardConfirm(false);
      setOpen(false);
    },
  };

  return { open, setOpen, handleOpenChange, discardDialogProps };
}
