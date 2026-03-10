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
