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

// Layers that open ABOVE an editor sheet and close on their own Escape: pickers
// (popovers), selects, menus, nested dialogs, the discard confirmation, and the
// rich-text editor's slash / mention menu. Our listener runs in the CAPTURE
// phase on `document`, so it sees Escape before any of them — if it handled the
// key it would stopPropagation() and close the whole sheet while the picker
// stayed open underneath. While one of these is open, Escape is theirs.
const INNER_LAYER_SELECTOR = [
  "[data-slot=popover-content][data-open]",
  "[data-slot=select-content][data-open]",
  "[data-slot=combobox-content][data-open]",
  "[data-slot=dropdown-menu-content][data-open]",
  "[data-slot=context-menu-content][data-open]",
  "[data-slot=dialog-content][data-open]",
  "[data-slot=alert-dialog-content][data-open]",
  ".bn-suggestion-menu",
].join(",");

export function hasOpenInnerLayer(doc: Document = document): boolean {
  return doc.querySelector(INNER_LAYER_SELECTOR) !== null;
}

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

  // Mirrors `open` on every render. The reset effect below has an empty
  // dependency list, so its cleanup closes over the FIRST render's `open`; it
  // must read the current value from here instead.
  const openRef = useRef(open);
  openRef.current = open;
  const showDiscardRef = useRef(showDiscardConfirm);
  showDiscardRef.current = showDiscardConfirm;

  // Set by the reset cleanup when the route was hidden with the sheet (or its
  // discard confirmation) open; consumed by the reset effect on reveal.
  const hiddenWhileOpen = useRef(false);
  // Latch armed on reveal: the parent's `dialogOpen` is still the stale `true`
  // it held when the route was hidden, and must not re-open the sheet. Cleared
  // by the first `dialogOpen === false`.
  const ignoreTrueFromParent = useRef(false);

  // Reset when <Activity> hides the route (Next 16.4 keeps routes mounted across
  // back/forward). After back/forward an editor sheet must be closed with its
  // form reset, exactly as before 16.4. Measured in React 19.3:
  //  1. Hiding runs every effect cleanup and revealing re-runs every effect with
  //     mount semantics, while `useState` survives. A setState in the cleanup is
  //     applied while hidden, so the sheet is already closed on reveal and
  //     EditorSheet's close branch resets the form.
  //  2. An empty-dependency cleanup reads the first render's `open`, hence
  //     `openRef`.
  //  3. Effects run in declaration order. This effect is declared BEFORE the
  //     dialogOpen sync effect, so the latch is armed before the sync effect sees
  //     the parent's stale `true`; declared after, the sheet re-opens.
  //  4. It never calls `onDialogOpenChange`. The notify effect re-runs on reveal
  //     with `open === false` and tells the parent once; calling it here too
  //     would tell the parent twice.
  // Strict Mode's fake unmount on first mount finds `openRef` still false, so
  // the latch is never armed then and a controlled or forceShow sheet still
  // opens on mount.
  // A real unmount also runs the cleanup; the setStates on an unmounted
  // component are no-ops.
  useEffect(() => {
    if (hiddenWhileOpen.current) {
      hiddenWhileOpen.current = false;
      ignoreTrueFromParent.current = true;
    }
    return () => {
      const wasOpen = openRef.current || showDiscardRef.current;
      hiddenWhileOpen.current = wasOpen;
      // Only when something is open: on Strict Mode's fake unmount the
      // forceShow effect's setOpen(true) is still pending (`openRef` is false),
      // and an unconditional setOpen(false) here would cancel it for good — the
      // forceShow guard below does not open again for an unchanged prop.
      if (wasOpen) {
        setOpen(false);
        setShowDiscardConfirm(false);
      }
    };
  }, []);

  // Sync open state from external dialogOpen prop.
  // `open` is intentionally NOT a dependency: this effect must run only when the
  // prop changes. Adding `open` would re-fire on internal closes and immediately
  // re-open the dialog (dialogOpen still true while open just went false).
  // After an <Activity> reveal it also re-runs with mount semantics while the
  // parent's `dialogOpen` is still the stale `true`: the `ignoreTrueFromParent`
  // latch drops that `true` until the parent reports `false` (the notify effect
  // tells it). A latch, not a one-shot flag: under Strict Mode the reveal runs
  // this effect twice, and a one-shot flag let the second pass re-open the sheet.
  useEffect(() => {
    if (ignoreTrueFromParent.current) {
      if (options?.dialogOpen === true) return;
      if (options?.dialogOpen === false) ignoreTrueFromParent.current = false;
    }
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

  // Force show — only on a change to `true`. The effect re-runs on an
  // <Activity> reveal with the prop unchanged; opening then would undo the reset.
  const lastForceShow = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (options?.forceShow && lastForceShow.current !== true) setOpen(true);
    lastForceShow.current = options?.forceShow;
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
        if (hasOpenInnerLayer()) return;
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
