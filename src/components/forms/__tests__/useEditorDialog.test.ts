import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEditorDialog } from "../useEditorDialog";

describe("useEditorDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("open state", () => {
    it("should start closed by default", () => {
      const { result } = renderHook(() => useEditorDialog(() => false));
      expect(result.current.open).toBe(false);
    });

    it("should allow setting open state directly", () => {
      const { result } = renderHook(() => useEditorDialog(() => false));
      act(() => result.current.setOpen(true));
      expect(result.current.open).toBe(true);
    });
  });

  describe("handleOpenChange", () => {
    it("should open dialog when called with true", () => {
      const { result } = renderHook(() => useEditorDialog(() => false));
      act(() => result.current.handleOpenChange(true));
      expect(result.current.open).toBe(true);
    });

    it("should close dialog when form is not dirty", () => {
      const { result } = renderHook(() => useEditorDialog(() => false));
      act(() => result.current.setOpen(true));
      act(() => result.current.handleOpenChange(false));
      expect(result.current.open).toBe(false);
    });

    it("should show discard confirmation when form is dirty and closing", () => {
      const { result } = renderHook(() => useEditorDialog(() => true));
      act(() => result.current.setOpen(true));
      act(() => result.current.handleOpenChange(false));
      expect(result.current.open).toBe(true);
      expect(result.current.discardDialogProps.open).toBe(true);
    });
  });

  describe("discardDialogProps", () => {
    it("should close both dialogs on discard", () => {
      const { result } = renderHook(() => useEditorDialog(() => true));
      act(() => result.current.setOpen(true));
      act(() => result.current.handleOpenChange(false));
      expect(result.current.discardDialogProps.open).toBe(true);
      act(() => result.current.discardDialogProps.onDiscard());
      expect(result.current.discardDialogProps.open).toBe(false);
      expect(result.current.open).toBe(false);
    });

    it("should allow dismissing discard dialog via onOpenChange", () => {
      const { result } = renderHook(() => useEditorDialog(() => true));
      act(() => result.current.setOpen(true));
      act(() => result.current.handleOpenChange(false));
      act(() => result.current.discardDialogProps.onOpenChange(false));
      expect(result.current.discardDialogProps.open).toBe(false);
      expect(result.current.open).toBe(true);
    });
  });

  describe("options.dialogOpen", () => {
    it("should sync open state from external dialogOpen prop", () => {
      const { result, rerender } = renderHook(({ dialogOpen }) => useEditorDialog(() => false, { dialogOpen }), {
        initialProps: { dialogOpen: false },
      });
      expect(result.current.open).toBe(false);
      rerender({ dialogOpen: true });
      expect(result.current.open).toBe(true);
    });
  });

  describe("options.onDialogOpenChange", () => {
    it("should notify parent when open state changes", () => {
      const onDialogOpenChange = vi.fn();
      const { result } = renderHook(() => useEditorDialog(() => false, { onDialogOpenChange }));
      act(() => result.current.setOpen(true));
      expect(onDialogOpenChange).toHaveBeenCalledWith(true);
    });

    it("should NOT re-notify when only the callback identity changes (open unchanged)", () => {
      // Regression: an unmemoised parent callback must not make the notify effect
      // re-emit the current `open` on every render (a closed dialog spamming
      // onDialogOpenChange(false) corrupts shared-state dialog multiplexers).
      const calls: boolean[] = [];
      const { rerender } = renderHook(({ cb }) => useEditorDialog(() => false, { onDialogOpenChange: cb }), {
        initialProps: { cb: (o: boolean) => calls.push(o) },
      });
      const afterMount = calls.length; // mount emits once (false)
      for (let i = 0; i < 5; i++) {
        rerender({ cb: (o: boolean) => calls.push(o) }); // brand-new callback each render, open stays false
      }
      expect(calls.length).toBe(afterMount);
    });

    it("should notify with the LATEST callback when open actually changes", () => {
      const first = vi.fn();
      const second = vi.fn();
      const { result, rerender } = renderHook(({ cb }) => useEditorDialog(() => false, { onDialogOpenChange: cb }), {
        initialProps: { cb: first },
      });
      rerender({ cb: second }); // swap callback while still closed
      act(() => result.current.setOpen(true));
      expect(second).toHaveBeenCalledWith(true);
    });
  });

  describe("options.forceShow", () => {
    it("should open dialog when forceShow becomes true", () => {
      const { result, rerender } = renderHook(({ forceShow }) => useEditorDialog(() => false, { forceShow }), {
        initialProps: { forceShow: false },
      });
      expect(result.current.open).toBe(false);
      rerender({ forceShow: true });
      expect(result.current.open).toBe(true);
    });
  });

  describe("options.onClose", () => {
    it("should call onClose when dialog closes", () => {
      const onClose = vi.fn();
      const { result } = renderHook(() => useEditorDialog(() => false, { onClose }));
      act(() => result.current.setOpen(true));
      act(() => result.current.setOpen(false));
      expect(onClose).toHaveBeenCalled();
    });

    it("should call onClose when discard is confirmed", () => {
      const onClose = vi.fn();
      const { result } = renderHook(() => useEditorDialog(() => true, { onClose }));
      act(() => result.current.setOpen(true));
      act(() => result.current.handleOpenChange(false));
      act(() => result.current.discardDialogProps.onDiscard());
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("escape key handler", () => {
    it("should trigger handleOpenChange(false) on Escape when open", () => {
      const { result } = renderHook(() => useEditorDialog(() => true));
      act(() => result.current.setOpen(true));

      const event = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      });
      act(() => document.dispatchEvent(event));

      expect(result.current.discardDialogProps.open).toBe(true);
    });

    it("should not react to Escape when closed", () => {
      const { result } = renderHook(() => useEditorDialog(() => true));

      const event = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      });
      act(() => document.dispatchEvent(event));

      expect(result.current.discardDialogProps.open).toBe(false);
    });
  });
});
