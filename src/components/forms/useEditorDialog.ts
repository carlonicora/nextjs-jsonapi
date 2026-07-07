"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

  // Notify parent when open state changes — but skip the echo when this change
  // was driven by the dialogOpen prop above (otherwise it ping-pongs).
  useEffect(() => {
    if (syncingFromProp.current) {
      syncingFromProp.current = false;
      return;
    }
    if (typeof options?.onDialogOpenChange === "function") {
      options.onDialogOpenChange(open);
    }
  }, [open, options?.onDialogOpenChange]);

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

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
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
