import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EditorSheet } from "../EditorSheet";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => {
    const t = (key: string, params?: Record<string, string>) => {
      if (params?.type) return `${key}:${params.type}`;
      return key;
    };
    return t;
  },
}));

// Mock usePageUrlGenerator
vi.mock("../../../hooks/usePageUrlGenerator", () => ({
  usePageUrlGenerator: () => (params: { page?: any; id?: string }) => `/test/${params.id || ""}`,
}));

// Mock errorToast
vi.mock("../../errors/errorToast", () => ({
  errorToast: vi.fn(),
}));

const testModule = { pageUrl: "/test", name: "tests" } as any;

const schema = z.object({
  name: z.string().min(1),
});

function TestEditor({
  onSubmit = vi.fn().mockResolvedValue({ id: "123" }),
  isEdit = false,
  ...props
}: Partial<React.ComponentProps<typeof EditorSheet>> & { onSubmit?: any }) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  return (
    <EditorSheet
      form={form}
      onSubmit={onSubmit}
      onReset={() => ({ name: "" })}
      entityType="Test Entity"
      isEdit={isEdit}
      module={testModule}
      {...props}
    >
      <input {...form.register("name")} data-testid="name-input" />
    </EditorSheet>
  );
}

describe("EditorSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("trigger rendering", () => {
    it("should render create button when not editing", () => {
      render(<TestEditor />);
      expect(screen.getByText("ui.buttons.create")).toBeTruthy();
    });

    it("should render custom trigger when provided", () => {
      render(<TestEditor trigger={<button>Custom</button>} />);
      expect(screen.getByText("Custom")).toBeTruthy();
    });

    it("should not render trigger when dialogOpen is controlled", () => {
      render(<TestEditor dialogOpen={false} />);
      expect(screen.queryByText("ui.buttons.create")).toBeNull();
    });
  });

  describe("sheet header", () => {
    it("should show create title when not editing", () => {
      render(<TestEditor dialogOpen={true} />);
      expect(screen.getByText("common.edit.create.title:Test Entity")).toBeTruthy();
    });

    it("should show update title when editing", () => {
      render(<TestEditor dialogOpen={true} isEdit={true} entityName="My Item" />);
      expect(screen.getByText("common.edit.update.title:Test Entity")).toBeTruthy();
    });
  });

  describe("size presets", () => {
    it("should default to xl size", () => {
      render(<TestEditor dialogOpen={true} />);
      const content = document.querySelector("[data-side]");
      expect(content?.className).toContain("max-w-7xl");
    });

    it("should apply sm size", () => {
      render(<TestEditor dialogOpen={true} size="sm" />);
      const content = document.querySelector("[data-side]");
      expect(content?.className).toContain("max-w-2xl");
    });
  });

  describe("submit flow", () => {
    it("should call onSubmit with form values on submit", async () => {
      const onSubmit = vi.fn().mockResolvedValue({ id: "abc" });
      render(<TestEditor dialogOpen={true} onSubmit={onSubmit} />);

      const input = screen.getByTestId("name-input");
      await userEvent.type(input, "Test Name");

      const submitButton = screen.getByTestId("modal-button-create");
      await userEvent.click(submitButton);

      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: "Test Name" }));
    });

    it("should call onSuccess instead of navigation when provided", async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const onSuccess = vi.fn();
      const onNavigate = vi.fn();
      render(<TestEditor dialogOpen={true} onSubmit={onSubmit} onSuccess={onSuccess} onNavigate={onNavigate} />);

      const input = screen.getByTestId("name-input");
      await userEvent.type(input, "Test Name");

      const submitButton = screen.getByTestId("modal-button-create");
      await userEvent.click(submitButton);

      expect(onSuccess).toHaveBeenCalled();
      expect(onNavigate).not.toHaveBeenCalled();
    });

    it("should call onNavigate when onSuccess is not provided", async () => {
      const onSubmit = vi.fn().mockResolvedValue({ id: "abc" });
      const onNavigate = vi.fn();
      render(<TestEditor dialogOpen={true} onSubmit={onSubmit} onNavigate={onNavigate} />);

      const input = screen.getByTestId("name-input");
      await userEvent.type(input, "Test Name");

      const submitButton = screen.getByTestId("modal-button-create");
      await userEvent.click(submitButton);

      expect(onNavigate).toHaveBeenCalledWith("/test/abc");
    });

    it("should call onRevalidate on successful submit", async () => {
      const onSubmit = vi.fn().mockResolvedValue({ id: "abc" });
      const onRevalidate = vi.fn();
      render(<TestEditor dialogOpen={true} onSubmit={onSubmit} onRevalidate={onRevalidate} />);

      const input = screen.getByTestId("name-input");
      await userEvent.type(input, "Test Name");

      const submitButton = screen.getByTestId("modal-button-create");
      await userEvent.click(submitButton);

      expect(onRevalidate).toHaveBeenCalled();
    });

    it("should call propagateChanges instead of onNavigate when editing", async () => {
      const onSubmit = vi.fn().mockResolvedValue({ id: "abc", name: "Updated" });
      const propagateChanges = vi.fn();
      const onNavigate = vi.fn();
      render(
        <TestEditor
          dialogOpen={true}
          isEdit={true}
          onSubmit={onSubmit}
          propagateChanges={propagateChanges}
          onNavigate={onNavigate}
        />,
      );

      const input = screen.getByTestId("name-input");
      await userEvent.type(input, "Test Name");

      const submitButton = screen.getByTestId("modal-button-create");
      await userEvent.click(submitButton);

      expect(propagateChanges).toHaveBeenCalledWith({ id: "abc", name: "Updated" });
      expect(onNavigate).not.toHaveBeenCalled();
    });

    it("should show error toast on submit failure", async () => {
      const { errorToast: mockErrorToast } = await import("../../errors/errorToast");
      const error = new Error("Network error");
      const onSubmit = vi.fn().mockRejectedValue(error);
      render(<TestEditor dialogOpen={true} onSubmit={onSubmit} />);

      const input = screen.getByTestId("name-input");
      await userEvent.type(input, "Test Name");

      const submitButton = screen.getByTestId("modal-button-create");
      await userEvent.click(submitButton);

      expect(mockErrorToast).toHaveBeenCalledWith({
        title: "generic.errors.create",
        error,
      });
    });
  });

  describe("disabled prop", () => {
    it("should disable submit button when disabled prop is true", () => {
      render(<TestEditor dialogOpen={true} disabled={true} />);
      const submitButton = screen.getByTestId("modal-button-create");
      expect(submitButton).toBeDisabled();
    });
  });
});
