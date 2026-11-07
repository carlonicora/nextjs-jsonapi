import { beforeEach, describe, expect, it, vi } from "vitest";

const { sonnerToast } = vi.hoisted(() => {
  const fn = vi.fn() as ReturnType<typeof vi.fn> & { error: ReturnType<typeof vi.fn> };
  fn.error = vi.fn();
  return { sonnerToast: fn };
});

vi.mock("sonner", () => ({ toast: sonnerToast }));

import { showToast, type ToastOptions } from "../toast";

describe("showToast", () => {
  beforeEach(() => {
    sonnerToast.mockClear();
  });

  it("showToast passes cancel to sonner", () => {
    const onClick = vi.fn();

    showToast("m", { cancel: { label: "Undo", onClick } });

    expect(sonnerToast).toHaveBeenCalledWith("m", expect.objectContaining({ cancel: { label: "Undo", onClick } }));
  });

  it("showToast without cancel passes the options unchanged", () => {
    const action = { label: "Open", onClick: vi.fn() };

    showToast("m", { id: "x", action });

    expect(sonnerToast).toHaveBeenCalledWith("m", { id: "x", action });
  });

  it("ToastOptions accepts cancel", () => {
    const o: ToastOptions = { cancel: { label: "x", onClick: () => {} } };

    expect(o.cancel).toBeDefined();
  });
});
