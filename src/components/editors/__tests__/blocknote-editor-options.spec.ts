import * as coreLocales from "@blocknote/core/locales";
import { describe, expect, it, vi } from "vitest";
import * as Y from "yjs";
import { buildBlockNoteEditorOptions, resolveEditable } from "../blockNoteEditorOptions";

const content = [{ type: "paragraph", content: "hello" }] as any;
const baseParams = () => ({
  placeholder: "Write here",
  schema: { schema: true } as any,
  initialContent: content,
  uploadFile: vi.fn(async () => "https://s3/image.png"),
  aiExtension: undefined,
  coreDictionary: coreLocales.en,
  aiDictionary: {} as any,
});

describe("buildBlockNoteEditorOptions", () => {
  it("without collaboration: passes the validated content and sets no collaboration", () => {
    const options = buildBlockNoteEditorOptions(baseParams());
    expect(options.initialContent).toBe(content);
    expect("collaboration" in options).toBe(false);
    expect(options.extensions).toBeUndefined();
    expect(options.disableExtensions).toBeUndefined();
    expect(options.placeholders).toEqual({ emptyDocument: "Write here" });
    expect(options.dictionary).toBeUndefined();
  });

  it("with collaboration: the Yjs document is the content, never the validated content", () => {
    const doc = new Y.Doc();
    const collaboration = { fragment: doc.getXmlFragment("document-store"), user: { name: "Ann", color: "#f00" } };
    const options = buildBlockNoteEditorOptions({ ...baseParams(), collaboration });
    expect((options as any).collaboration).toBe(collaboration);
    expect(options.initialContent).not.toBe(content);
    // BlockNote's fixed single-block placeholder for collaborative documents.
    expect(options.initialContent).toEqual([{ type: "paragraph", id: "initialBlockId" }]);
    expect(options.extensions).toHaveLength(1);
    expect(options.disableExtensions).toContain("history");
  });

  it("with collaboration and AI: keeps the AI extension next to the collaboration one", () => {
    const doc = new Y.Doc();
    const aiExtension = { ai: true } as any;
    const collaboration = { fragment: doc.getXmlFragment("document-store"), user: { name: "Ann", color: "#f00" } };
    const options = buildBlockNoteEditorOptions({ ...baseParams(), aiExtension, collaboration });
    expect(options.extensions).toHaveLength(2);
    expect(options.extensions![0]).toBe(aiExtension);
  });

  it("disableUploads: true leaves uploadFile undefined", () => {
    const options = buildBlockNoteEditorOptions({ ...baseParams(), disableUploads: true });
    expect(options.uploadFile).toBeUndefined();
  });

  it("uploads on by default: uploadFile is the upload function", () => {
    const params = baseParams();
    expect(buildBlockNoteEditorOptions(params).uploadFile).toBe(params.uploadFile);
    expect(buildBlockNoteEditorOptions({ ...params, disableUploads: false }).uploadFile).toBe(params.uploadFile);
  });

  it("keeps today's dictionary rule: AI adds the AI dictionary, a non-English core dictionary is passed", () => {
    const aiExtension = { ai: true } as any;
    const aiDictionary = { ai: "dict" } as any;
    const withAi = buildBlockNoteEditorOptions({ ...baseParams(), aiExtension, aiDictionary });
    expect(withAi.extensions).toEqual([aiExtension]);
    expect(withAi.dictionary).toEqual({ ...coreLocales.en, ai: aiDictionary });
    const italian = buildBlockNoteEditorOptions({ ...baseParams(), coreDictionary: coreLocales.it });
    expect(italian.dictionary).toBe(coreLocales.it);
  });
});

describe("resolveEditable", () => {
  it("editable wins when defined", () => {
    expect(resolveEditable({ editable: true, onChange: undefined })).toBe(true);
    expect(resolveEditable({ editable: false, onChange: () => {} })).toBe(false);
  });

  it("falls back to onChange !== undefined", () => {
    expect(resolveEditable({ editable: undefined, onChange: () => {} })).toBe(true);
    expect(resolveEditable({ editable: undefined, onChange: undefined })).toBe(false);
  });
});
