import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CommonEditorDiscardDialog } from "../CommonEditorDiscardDialog";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("CommonEditorDiscardDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onDiscard: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render dialog content when open", () => {
    render(<CommonEditorDiscardDialog {...defaultProps} />);
    expect(screen.getByText("ui.dialogs.unsaved_changes_title")).toBeInTheDocument();
    expect(screen.getByText("ui.dialogs.unsaved_changes_description")).toBeInTheDocument();
  });

  it("should render cancel and discard buttons", () => {
    render(<CommonEditorDiscardDialog {...defaultProps} />);
    expect(screen.getByText("ui.buttons.cancel")).toBeInTheDocument();
    expect(screen.getByText("ui.dialogs.unsaved_changes_discard")).toBeInTheDocument();
  });

  it("should call onDiscard when discard button is clicked", () => {
    render(<CommonEditorDiscardDialog {...defaultProps} />);
    fireEvent.click(screen.getByText("ui.dialogs.unsaved_changes_discard"));
    expect(defaultProps.onDiscard).toHaveBeenCalled();
  });

  it("should not render when closed", () => {
    render(<CommonEditorDiscardDialog {...defaultProps} open={false} />);
    expect(screen.queryByText("ui.dialogs.unsaved_changes_title")).not.toBeInTheDocument();
  });
});
