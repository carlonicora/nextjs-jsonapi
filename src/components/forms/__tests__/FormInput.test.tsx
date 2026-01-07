import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FormInput } from "../FormInput";
import { FormProvider, useForm } from "react-hook-form";
import React from "react";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Wrapper component to provide form context
function FormWrapper({
  children,
  defaultValues = {},
}: {
  children: (form: any) => React.ReactNode;
  defaultValues?: Record<string, any>;
}) {
  const form = useForm({ defaultValues });
  return <FormProvider {...form}>{children(form)}</FormProvider>;
}

describe("FormInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render input without label", () => {
      render(
        <FormWrapper defaultValues={{ title: "" }}>
          {(form) => <FormInput form={form} id="title" />}
        </FormWrapper>
      );

      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("should render input with label", () => {
      render(
        <FormWrapper defaultValues={{ title: "" }}>
          {(form) => <FormInput form={form} id="title" name="Title" />}
        </FormWrapper>
      );

      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("should render required indicator when isRequired is true", () => {
      render(
        <FormWrapper defaultValues={{ title: "" }}>
          {(form) => <FormInput form={form} id="title" name="Title" isRequired={true} />}
        </FormWrapper>
      );

      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("should render placeholder", () => {
      render(
        <FormWrapper defaultValues={{ title: "" }}>
          {(form) => <FormInput form={form} id="title" placeholder="Enter title" />}
        </FormWrapper>
      );

      expect(screen.getByPlaceholderText("Enter title")).toBeInTheDocument();
    });

    it("should render with testId", () => {
      render(
        <FormWrapper defaultValues={{ title: "" }}>
          {(form) => <FormInput form={form} id="title" testId="title-input" />}
        </FormWrapper>
      );

      expect(screen.getByTestId("title-input")).toBeInTheDocument();
    });
  });

  describe("input types", () => {
    it("should render text input by default", () => {
      render(
        <FormWrapper defaultValues={{ title: "" }}>
          {(form) => <FormInput form={form} id="title" />}
        </FormWrapper>
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "text");
    });

    it("should render number input for type number", () => {
      render(
        <FormWrapper defaultValues={{ count: 0 }}>
          {(form) => <FormInput form={form} id="count" type="number" />}
        </FormWrapper>
      );

      const input = screen.getByRole("spinbutton");
      expect(input).toHaveAttribute("type", "number");
    });

    it("should render number input with euro symbol for currency", () => {
      render(
        <FormWrapper defaultValues={{ price: 0 }}>
          {(form) => <FormInput form={form} id="price" type="currency" />}
        </FormWrapper>
      );

      expect(screen.getByText("€")).toBeInTheDocument();
      const input = screen.getByRole("spinbutton");
      expect(input).toHaveAttribute("type", "number");
    });

    it("should render password input for type password", () => {
      render(
        <FormWrapper defaultValues={{ password: "" }}>
          {(form) => <FormInput form={form} id="password" type="password" />}
        </FormWrapper>
      );

      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });

    it("should render text input for type link", () => {
      render(
        <FormWrapper defaultValues={{ url: "" }}>
          {(form) => <FormInput form={form} id="url" type="link" />}
        </FormWrapper>
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "text");
    });
  });

  describe("user interaction", () => {
    it("should update value on change for text input", () => {
      render(
        <FormWrapper defaultValues={{ title: "" }}>
          {(form) => <FormInput form={form} id="title" />}
        </FormWrapper>
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "New Title" } });

      expect(input).toHaveValue("New Title");
    });

    it("should accept numeric values for number input", () => {
      render(
        <FormWrapper defaultValues={{ count: 0 }}>
          {(form) => <FormInput form={form} id="count" type="number" />}
        </FormWrapper>
      );

      const input = screen.getByRole("spinbutton");
      fireEvent.change(input, { target: { value: "123" } });

      // Should accept the number
      expect(input).toHaveValue(123);
    });

    it("should call onChange when value changes", () => {
      const onChange = vi.fn();
      render(
        <FormWrapper defaultValues={{ title: "" }}>
          {(form) => <FormInput form={form} id="title" onChange={onChange} />}
        </FormWrapper>
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "Test" } });

      expect(onChange).toHaveBeenCalledWith("Test");
    });

    it("should call onBlur when input loses focus", async () => {
      const onBlur = vi.fn().mockResolvedValue(undefined);
      render(
        <FormWrapper defaultValues={{ title: "" }}>
          {(form) => <FormInput form={form} id="title" onBlur={onBlur} />}
        </FormWrapper>
      );

      const input = screen.getByRole("textbox");
      fireEvent.focus(input);
      fireEvent.blur(input);

      await waitFor(() => {
        expect(onBlur).toHaveBeenCalled();
      });
    });

    it("should call onKeyDown when key is pressed", () => {
      const onKeyDown = vi.fn();
      render(
        <FormWrapper defaultValues={{ title: "" }}>
          {(form) => <FormInput form={form} id="title" onKeyDown={onKeyDown} />}
        </FormWrapper>
      );

      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onKeyDown).toHaveBeenCalled();
    });
  });

  describe("disabled state", () => {
    it("should disable input when disabled prop is true", () => {
      render(
        <FormWrapper defaultValues={{ title: "" }}>
          {(form) => <FormInput form={form} id="title" disabled={true} />}
        </FormWrapper>
      );

      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });

    it("should not be disabled by default", () => {
      render(
        <FormWrapper defaultValues={{ title: "" }}>
          {(form) => <FormInput form={form} id="title" />}
        </FormWrapper>
      );

      const input = screen.getByRole("textbox");
      expect(input).not.toBeDisabled();
    });
  });

  describe("link validation", () => {
    it("should add https:// prefix on blur if missing for link type", () => {
      render(
        <FormWrapper defaultValues={{ url: "" }}>
          {(form) => <FormInput form={form} id="url" type="link" />}
        </FormWrapper>
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "example.com" } });
      fireEvent.blur(input);

      expect(input).toHaveValue("https://example.com");
    });

    it("should not modify URL if already has https://", () => {
      render(
        <FormWrapper defaultValues={{ url: "" }}>
          {(form) => <FormInput form={form} id="url" type="link" />}
        </FormWrapper>
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "https://example.com" } });
      fireEvent.blur(input);

      expect(input).toHaveValue("https://example.com");
    });

    it("should not modify URL if already has http://", () => {
      render(
        <FormWrapper defaultValues={{ url: "" }}>
          {(form) => <FormInput form={form} id="url" type="link" />}
        </FormWrapper>
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "http://example.com" } });
      fireEvent.blur(input);

      expect(input).toHaveValue("http://example.com");
    });
  });

  describe("autoFocus", () => {
    it("should autofocus input when autoFocus is true", () => {
      render(
        <FormWrapper defaultValues={{ title: "" }}>
          {(form) => <FormInput form={form} id="title" autoFocus={true} />}
        </FormWrapper>
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveFocus();
    });
  });
});
