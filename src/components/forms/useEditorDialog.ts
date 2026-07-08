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

  // Sync open state from external dialogOpen prop
  useEffect(() => {
    if (options?.dialogOpen !== undefined) {
      setOpen(options.dialogOpen);
    }
  }, [options?.dialogOpen]);

  // Keep the latest onDialogOpenChange in a ref so the notify effect can read it
  // at fire time WITHOUT depending on its identity. Otherwise a consumer passing
  // an inline (unmemoised) callback makes this effect re-run every render and
  // re-emit the current `open` value (e.g. a closed EditorSheet spamming
  // onDialogOpenChange(false)), which corrupts parents that multiplex several
  // dialogs through one piece of state.
  const onDialogOpenChangeRef = useRef(options?.onDialogOpenChange);
  onDialogOpenChangeRef.current = options?.onDialogOpenChange;

  // Notify parent when open state changes. Depends ONLY on `open` so it fires on
  // real open changes, never on callback identity.
  useEffect(() => {
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
