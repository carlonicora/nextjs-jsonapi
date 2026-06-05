import { describe, it, expect } from "vitest";
import { makeFrontendData } from "./fixtures";
import { generateEditorTemplate } from "../templates/components/editor.template";

describe("editor template — EditorSheet", () => {
  it("uses EditorSheet and not the legacy Dialog stack", () => {
    const out = generateEditorTemplate(makeFrontendData());
    expect(out).toContain("EditorSheet");
    expect(out).not.toContain("CommonEditorButtons");
    expect(out).not.toContain("CommonEditorDiscardDialog");
    expect(out).not.toContain("useEditorDialog");
    expect(out).not.toMatch(/DialogContent/);
  });

  it("gates the default export on hasPermissionToModule", () => {
    const out = generateEditorTemplate(makeFrontendData());
    expect(out).toContain("useCurrentUserContext");
    expect(out).toContain("hasPermissionToModule({ module: Modules.Widget, action, data: props.widget })");
  });

  it("wraps formSchema in useMemo and defaults in useCallback", () => {
    const out = generateEditorTemplate(makeFrontendData());
    expect(out).toContain("const formSchema = useMemo(");
    expect(out).toContain("const getDefaultValues = useCallback(");
  });

  it("passes EditorSheet lifecycle props and onSubmit returns the saved entity", () => {
    const out = generateEditorTemplate(makeFrontendData());
    expect(out).toContain("onRevalidate={revalidatePaths}");
    expect(out).toContain("onReset={getDefaultValues}");
    expect(out).toContain("module={Modules.Widget}");
    // onSubmit returns the service result (no manual setOpen/errorToast)
    expect(out).not.toContain("setOpen(false)");
    expect(out).not.toContain("errorToast(");
  });
});
