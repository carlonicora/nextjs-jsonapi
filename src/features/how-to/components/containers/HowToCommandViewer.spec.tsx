import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HowToCommandViewer from "./HowToCommandViewer";

const { viewer } = vi.hoisted(() => ({ viewer: vi.fn() }));

vi.mock("../../../../components", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../components")>()),
  BlockNoteViewerContainer: (props: { content: unknown }) => {
    viewer(props);
    return <div data-testid="viewer" />;
  },
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

const howTo = {
  id: "g1",
  name: "Creare una pratica",
  description: JSON.stringify([{ type: "paragraph", content: [{ type: "text", text: "Ciao", styles: {} }] }]),
} as any;

describe("HowToCommandViewer", () => {
  it("renders the guide with the read-only viewer, so no user context is required", () => {
    render(<HowToCommandViewer howTo={howTo} onBack={vi.fn()} />);

    expect(screen.getByTestId("viewer")).toBeInTheDocument();
    expect(viewer).toHaveBeenCalledWith(expect.objectContaining({ content: howTo.description }));
    expect(screen.getByText("Creare una pratica")).toBeInTheDocument();
  });
});
