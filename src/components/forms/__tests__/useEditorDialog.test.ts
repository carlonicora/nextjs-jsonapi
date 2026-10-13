import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, render } from "@testing-library/react";
import { Activity, StrictMode, createElement, useState } from "react";
import { useEditorDialog } from "../useEditorDialog";

type ActivityMode = "visible" | "hidden";
type HookApi = ReturnType<typeof useEditorDialog>;

/**
 * Mounts a sheet driven by `useEditorDialog` inside a React `<Activity>`, the
 * way Next 16.4 keeps a route mounted but hidden across back/forward. The page
 * component sits inside the Activity, so its own state (the parent's
 * `dialogOpen`) survives the hide exactly as a route's state does.
 */
function renderInActivity(opts: {
  controlled?: boolean;
  initialParentOpen?: boolean;
  forceShow?: boolean;
  strict?: boolean;
  isFormDirty?: () => boolean;
  onClose?: () => void;
}) {
  const renders: boolean[] = [];
  const parentSpy = vi.fn();
  let api!: HookApi;
  let parentOpen: boolean | undefined;
  let setParentOpen!: (open: boolean) => void;

  function Sheet(props: { dialogOpen?: boolean; onDialogOpenChange?: (open: boolean) => void }) {
    api = useEditorDialog(opts.isFormDirty ?? (() => false), {
      ...props,
      forceShow: opts.forceShow,
      onClose: opts.onClose,
    });
    renders.push(api.open);
    return null;
  }

  function Page() {
    const [open, setOpen] = useState(opts.initialParentOpen ?? false);
    parentOpen = open;
    setParentOpen = setOpen;
    if (!opts.controlled) return createElement(Sheet);
    return createElement(Sheet, {
      dialogOpen: open,
      onDialogOpenChange: (next: boolean) => {
        parentSpy(next);
        setOpen(next);
      },
    });
  }

  function App({ mode }: { mode: ActivityMode }) {
    return createElement(Activity, { mode }, createElement(Page));
  }

  // StrictMode only double-invokes effects when it wraps the ROOT element.
  const root = (mode: ActivityMode) =>
    opts.strict ? createElement(StrictMode, null, createElement(App, { mode })) : createElement(App, { mode });

  const r = render(root("visible"));

  return {
    renders,
    parentSpy,
    get api() {
      return api;
    },
    get parentOpen() {
      return parentOpen;
    },
    openFromParent: () => act(() => setParentOpen(true)),
    hide: () => act(() => r.rerender(root("hidden"))),
    reveal: () => act(() => r.rerender(root("visible"))),
  };
}

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

  describe("escape key with an open picker / menu above the sheet", () => {
    const pressEscape = () => {
      const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
      act(() => {
        document.dispatchEvent(event);
      });
      return event;
    };

    const mountLayer = (html: string) => {
      const host = document.createElement("div");
      host.innerHTML = html;
      document.body.appendChild(host);
      return () => host.remove();
    };

    it.each([
      ['<div data-slot="popover-content" data-open></div>'],
      ['<div data-slot="select-content" data-open></div>'],
      ['<div data-slot="dropdown-menu-content" data-open></div>'],
      ['<div data-slot="dialog-content" data-open></div>'],
      ['<div class="bn-suggestion-menu"></div>'],
    ])("leaves Escape to the open layer %s and keeps the sheet open", (html) => {
      const { result } = renderHook(() => useEditorDialog(() => true));
      act(() => result.current.setOpen(true));
      const unmount = mountLayer(html);

      const event = pressEscape();

      expect(result.current.open).toBe(true);
      expect(result.current.discardDialogProps.open).toBe(false);
      expect(event.defaultPrevented).toBe(false);
      unmount();
    });

    it("handles Escape again once the layer has closed", () => {
      const { result } = renderHook(() => useEditorDialog(() => false));
      act(() => result.current.setOpen(true));
      const unmount = mountLayer('<div data-slot="popover-content" data-closed></div>');

      pressEscape();

      expect(result.current.open).toBe(false);
      unmount();
    });
  });

  describe("escape key with nested editors", () => {
    const pressEscape = () =>
      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
      });

    it("should close only the topmost editor, leaving the parent open", () => {
      // Each open editor adds its OWN document-level capture listener, and
      // stopPropagation() does not suppress sibling listeners on the same node.
      // Without a stack guard one Escape closes the parent too — e.g. a nested
      // create dialog takes the editor that opened it down with it.
      const outer = renderHook(() => useEditorDialog(() => false));
      act(() => outer.result.current.setOpen(true));

      const inner = renderHook(() => useEditorDialog(() => false));
      act(() => inner.result.current.setOpen(true));

      pressEscape();

      expect(inner.result.current.open).toBe(false);
      expect(outer.result.current.open).toBe(true);
    });

    it("should close the parent on a second Escape once the nested editor has closed", () => {
      const outer = renderHook(() => useEditorDialog(() => false));
      act(() => outer.result.current.setOpen(true));

      const inner = renderHook(() => useEditorDialog(() => false));
      act(() => inner.result.current.setOpen(true));

      pressEscape();
      pressEscape();

      expect(outer.result.current.open).toBe(false);
    });

    it("should hand Escape back to the parent when the nested editor unmounts while open", () => {
      const outer = renderHook(() => useEditorDialog(() => false));
      act(() => outer.result.current.setOpen(true));

      const inner = renderHook(() => useEditorDialog(() => false));
      act(() => inner.result.current.setOpen(true));

      // The nested editor is torn down without closing first (parent stopped
      // rendering it). Its stack entry must not strand Escape forever.
      inner.unmount();
      pressEscape();

      expect(outer.result.current.open).toBe(false);
    });

    it("should still show the discard prompt for the topmost editor when it is dirty", () => {
      const outer = renderHook(() => useEditorDialog(() => false));
      act(() => outer.result.current.setOpen(true));

      const inner = renderHook(() => useEditorDialog(() => true));
      act(() => inner.result.current.setOpen(true));

      pressEscape();

      expect(inner.result.current.discardDialogProps.open).toBe(true);
      expect(inner.result.current.open).toBe(true);
      expect(outer.result.current.open).toBe(true);
    });
  });

  describe("Activity hide and reveal (back/forward)", () => {
    it("controlled sheet does not reopen after Activity reveal", () => {
      const t = renderInActivity({ controlled: true, initialParentOpen: true });
      expect(t.api.open).toBe(true);
      t.parentSpy.mockClear();

      t.hide();
      const revealedAt = t.renders.length;
      t.reveal();

      expect(t.parentSpy.mock.calls).toEqual([[false]]);
      expect(t.parentOpen).toBe(false);
      expect(t.api.open).toBe(false);
      expect(t.renders.slice(revealedAt)).not.toContain(true);
    });

    it("sheet opened after mount is closed after Activity reveal", () => {
      const t = renderInActivity({});
      expect(t.api.open).toBe(false);
      act(() => t.api.setOpen(true));
      expect(t.api.open).toBe(true);

      t.hide();
      t.reveal();

      expect(t.api.open).toBe(false);
    });

    it("forceShow sheet stays closed after Activity reveal", () => {
      const t = renderInActivity({ forceShow: true });
      expect(t.api.open).toBe(true);

      t.hide();
      t.reveal();

      expect(t.api.open).toBe(false);
    });

    it("stays closed under StrictMode reveal", () => {
      const t = renderInActivity({ controlled: true, strict: true });
      t.openFromParent();
      expect(t.api.open).toBe(true);

      t.hide();
      const revealedAt = t.renders.length;
      t.reveal();

      // Strict Mode doubles the notify effect too, so parent calls are not counted.
      expect(t.renders.slice(revealedAt)).not.toContain(true);
      expect(t.api.open).toBe(false);
      expect(t.parentOpen).toBe(false);
    });

    it("controlled sheet still opens on first mount under StrictMode", () => {
      const t = renderInActivity({ controlled: true, initialParentOpen: true, strict: true });
      expect(t.api.open).toBe(true);
      expect(t.parentOpen).toBe(true);
    });

    it("discard confirmation is closed after Activity reveal", () => {
      const t = renderInActivity({ isFormDirty: () => true });
      act(() => t.api.setOpen(true));
      act(() => t.api.handleOpenChange(false));
      expect(t.api.discardDialogProps.open).toBe(true);

      t.hide();
      t.reveal();

      expect(t.api.discardDialogProps.open).toBe(false);
      expect(t.api.open).toBe(false);
    });

    it("onClose is called once per hide and reveal", () => {
      const onClose = vi.fn();
      const t = renderInActivity({ onClose });
      act(() => t.api.setOpen(true));
      onClose.mockClear();

      t.hide();
      t.reveal();

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("forceShow sheet still opens on first mount under StrictMode", () => {
      const t = renderInActivity({ forceShow: true, strict: true });
      expect(t.api.open).toBe(true);
    });
  });
});
