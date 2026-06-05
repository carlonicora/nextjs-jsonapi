import { describe, it, expect } from "vitest";
import { makeFrontendData } from "./fixtures";
import { generateContainerTemplate } from "../templates/components/container.template";
import { generateListContainerTemplate } from "../templates/components/list-container.template";
import { generateContentTemplate } from "../templates/components/content.template";

describe("container template", () => {
  it("uses RoundPageContainer with tabs and id, not details prop, and renders Content", () => {
    const out = generateContainerTemplate(makeFrontendData());
    expect(out).toContain("tabs: Tab[]");
    expect(out).toContain("id={widget.id}");
    expect(out).not.toContain("details={");
    expect(out).not.toContain("WidgetDetails");
    expect(out).toContain("<WidgetContent widget={widget} />");
  });

  it("emits an Activity tab by default and no Tasks tab", () => {
    const out = generateContainerTemplate(makeFrontendData());
    expect(out).toContain("<ActivityFeed module={Modules.Widget} entityId={widget.id} />");
    expect(out).not.toContain("TaskProvider");
  });

  it("omits the Activity tab when containerTabs.activity is false", () => {
    const out = generateContainerTemplate(makeFrontendData({ containerTabs: { activity: false, relations: [] } }));
    expect(out).not.toContain("ActivityFeed");
  });

  it("emits a relation tab when containerTabs.relations has an entry", () => {
    const out = generateContainerTemplate(makeFrontendData({
      containerTabs: { activity: true, relations: [{ module: "Quote", listProp: "widget", directory: "sales" }] },
    }));
    expect(out).toContain('import QuoteList from "@/features/sales/quote/components/lists/QuoteList"');
    expect(out).toContain("key: Modules.Quote");
    expect(out).toContain("<QuoteList widget={widget} />");
  });

  it("gates default export on hasPermissionToModule", () => {
    const out = generateContainerTemplate(makeFrontendData());
    expect(out).toContain("hasPermissionToModule({ module: Modules.Widget, action: Action.Delete, data: widget })");
  });
});

describe("list-container template", () => {
  it("always renders fullWidth", () => {
    const out = generateListContainerTemplate(makeFrontendData());
    expect(out).toContain("<RoundPageContainer module={Modules.Widget} fullWidth>");
    expect(out).toContain("<WidgetList fullWidth />");
  });
});

describe("content template", () => {
  it("is always generated (returns a string) and renders AttributeElement", () => {
    const out = generateContentTemplate(makeFrontendData());
    expect(typeof out).toBe("string");
    expect(out).toContain("export function WidgetContent");
    expect(out).toContain("AttributeElement");
  });
});
