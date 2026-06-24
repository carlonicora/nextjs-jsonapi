// packages/nextjs-jsonapi/src/shadcnui/ui/__tests__/confirm-dialog.test.tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "../confirm-dialog";

describe("ConfirmDialog", () => {
  it("renders title/description and calls onConfirm then closes", async () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="Reveal plot secrets?"
        description="Spoilers ahead."
        confirmLabel="Reveal"
        cancelLabel="Keep hidden"
        destructive
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByText("Reveal plot secrets?")).toBeInTheDocument();
    expect(screen.getByText("Spoilers ahead.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reveal" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("cancel closes without confirming", async () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="t"
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={onConfirm}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "No" }));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
