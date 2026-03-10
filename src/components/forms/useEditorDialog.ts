"use client";

import { useCallback, useEffect, useState } from "react";

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

  // Notify parent when open state changes
  useEffect(() => {
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
