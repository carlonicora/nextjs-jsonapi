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

  describe("BlockNote dirty state", () => {
    const richText = (name: string) => ({
      name,
      type: "blocknote",
      tsType: "any",
      zodSchema: "z.any()",
      formComponent: "BlockNoteEditor" as const,
      nullable: true,
      isContentField: true,
    });

    it("keeps EditorSheet's default dirty tracking when the module has no rich-text field", () => {
      const out = generateEditorTemplate(makeFrontendData());
      expect(out).toContain("onReset={getDefaultValues}");
      expect(out).not.toContain("isFormDirty");
      expect(out).not.toContain("useState");
    });

    it("ignores empty BlockNote editors in the dirty check and re-seeds emptiness on reset", () => {
      const data = makeFrontendData();
      data.fields = [...data.fields, richText("description"), richText("content")];
      const out = generateEditorTemplate(data);

      expect(out).toContain("useState");
      expect(out).toContain("const [isDescriptionEmpty, setIsDescriptionEmpty] = useState<boolean>(");
      expect(out).toContain(
        "!widget?.description || (Array.isArray(widget.description) && widget.description.length === 0)",
      );
      expect(out).toContain("const [isContentEmpty, setIsContentEmpty] = useState<boolean>(");
      expect(out).toContain("if (dirty.description && isDescriptionEmpty) delete dirty.description;");
      expect(out).toContain("if (dirty.content && isContentEmpty) delete dirty.content;");
      expect(out).toContain("}, [dirtyFields, isDescriptionEmpty, isContentEmpty]);");
      expect(out).toContain("isFormDirty={isFormDirty}");
      expect(out).toContain("onEmptyChange={setIsDescriptionEmpty}");
      expect(out).toContain("onEmptyChange={setIsContentEmpty}");
      expect(out).toContain("onReset={() => {");
      expect(out).toContain("setIsDescriptionEmpty(!widget?.description ||");
      expect(out).not.toContain("onReset={getDefaultValues}");
    });

    it("does not track the AI-owned abstract of a Content-extending module", () => {
      const data = makeFrontendData({ extendsContent: true });
      data.fields = [...data.fields, richText("abstract"), richText("content")];
      const out = generateEditorTemplate(data);

      expect(out).not.toContain("isAbstractEmpty");
      expect(out).toContain("isContentEmpty");
    });
  });
});
