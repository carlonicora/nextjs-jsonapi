import { describe, it, expect } from "vitest";
import { makeFrontendData, makeRelationship } from "./fixtures";
import { generateTableHookTemplate } from "../templates/table-hook.template";
import { generateModuleTemplate } from "../templates/module.template";
import { generateListTemplate } from "../templates/components/list.template";

describe("table-hook template", () => {
  it("emits cellDate for date fields", () => {
    const out = generateTableHookTemplate(makeFrontendData());
    expect(out).toContain("[WidgetFields.due_date]");
    expect(out).toContain("cellDate({");
  });

  it("emits a relationship column when showInTable", () => {
    const out = generateTableHookTemplate(makeFrontendData({
      relationships: [makeRelationship({ name: "Account", single: true, showInTable: true })],
    }));
    expect(out).toContain("widget.account?.name");
  });

  it("uses variant for single-relationship column key when no alias", () => {
    const out = generateTableHookTemplate(makeFrontendData({
      relationships: [makeRelationship({ name: "User", variant: "Author", single: true, showInTable: true })],
    }));
    expect(out).toContain("WidgetFields.author");
    expect(out).not.toContain("WidgetFields.user]");
  });

  it("emits a many relationship column joined by name", () => {
    const out = generateTableHookTemplate(makeFrontendData({
      relationships: [makeRelationship({ name: "Tag", single: false, showInTable: true })],
    }));
    expect(out).toContain("WidgetFields.tags");
    expect(out).toContain('.map((r) => r.name).join(", ")');
  });
});

describe("module template", () => {
  it("emits feature when featureId set", () => {
    const out = generateModuleTemplate(makeFrontendData({ featureId: "Crm" }));
    expect(out).toContain('import { FeatureIds } from "@/enums/feature.ids"');
    expect(out).toContain("feature: FeatureIds.Crm");
  });

  it("emits cross-module inclusions", () => {
    const out = generateModuleTemplate(makeFrontendData({
      relatedInclusions: [{ endpoint: "accounts", fields: ["name", "image"] }],
    }));
    expect(out).toContain('createJsonApiInclusion("accounts", [`name`, `image`])');
  });
});

describe("list template", () => {
  it("forwards fullWidth to ContentListTable", () => {
    const out = generateListTemplate(makeFrontendData());
    expect(out).toContain("fullWidth");
    expect(out).toContain("fullWidth={fullWidth}");
  });
});
