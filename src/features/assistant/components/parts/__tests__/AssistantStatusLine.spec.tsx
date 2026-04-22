import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AssistantStatusLine } from "../AssistantStatusLine";

// next-intl is globally mocked in vitest.setup.ts:
//   useTranslations: () => (key) => key
// So t("features.assistant.thinking") returns the key string.

describe("AssistantStatusLine", () => {
  it("renders the status when provided", () => {
    render(<AssistantStatusLine status="Reading orders · abc" />);
    expect(screen.getByText("Reading orders · abc")).toBeInTheDocument();
  });

  it("falls back to the translation key when no status", () => {
    render(<AssistantStatusLine />);
    expect(screen.getByText("features.assistant.thinking")).toBeInTheDocument();
  });
});
