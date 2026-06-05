import { describe, it, expect } from "vitest";
import { makeFrontendData, makeRelationship } from "./fixtures";
import { generateModelTemplate } from "../templates/data/model.template";
import { generateInterfaceTemplate } from "../templates/data/interface.template";

describe("model template — dates", () => {
  it("imports formatLocalDate and uses it for date fields in createJsonApi", () => {
    const out = generateModelTemplate(makeFrontendData());
    expect(out).toContain("formatLocalDate");
    expect(out).toContain("response.data.attributes.due_date = formatLocalDate(data.due_date)");
  });
});

describe("model template — relationship wire keys", () => {
  it("uses dtoKey verbatim for rehydrate and createJsonApi", () => {
    const out = generateModelTemplate(makeFrontendData({
      relationships: [makeRelationship({ name: "PipelineStage", single: true, dtoKey: "pipelinestage", interfaceName: "PipelineStageInterface", modelKebab: "pipeline-stage", selectorComponent: "PipelineStageSelector", interfaceImportPath: "@/features/crm/pipeline-stage/data/PipelineStageInterface" })],
    }));
    expect(out).toContain('"pipelinestage"');
    expect(out).toContain("response.data.relationships.pipelinestage");
  });

  it("emits per-item meta array for many-with-edge-fields", () => {
    const out = generateModelTemplate(makeFrontendData({
      relationships: [makeRelationship({
        name: "Item", single: false, dtoKey: "estimateitems", alias: "EstimateItem",
        interfaceName: "ItemInterface", modelKebab: "item", selectorComponent: "ItemMultiSelector",
        interfaceImportPath: "@/features/plm/item/data/ItemInterface",
        fields: [{ name: "quantity", type: "number", tsType: "number", zodSchema: "z.number()", formComponent: "FormInputNumber", nullable: false, isContentField: false }],
      })],
    }));
    expect(out).toContain("data.estimateItemMeta?.find");
    expect(out).toContain("response.data.relationships.estimateitems");
  });

  it("model references and imports the named RelationshipMeta interface", () => {
    const out = generateModelTemplate(makeFrontendData({
      relationships: [makeRelationship({
        name: "Item", single: false, dtoKey: "estimateitems", alias: "EstimateItem",
        interfaceName: "ItemInterface", modelKebab: "item", selectorComponent: "ItemMultiSelector",
        interfaceImportPath: "@/features/plm/item/data/ItemInterface",
        fields: [{ name: "quantity", type: "number", tsType: "number", zodSchema: "z.number()", formComponent: "FormInputNumber", nullable: false, isContentField: false }],
      })],
    }));
    expect(out).toContain("EstimateItemRelationshipMeta");
    expect(out).toContain("ItemInterface & EstimateItemRelationshipMeta");
    // imported from the module's own interface file (Widget)
    expect(out).toMatch(/import \{[^}]*EstimateItemRelationshipMeta[^}]*\} from "@\/features\/demo\/widget\/data\/WidgetInterface"/);
  });
});

describe("interface template", () => {
  it("emits a named RelationshipMeta interface and a meta array in Input", () => {
    const out = generateInterfaceTemplate(makeFrontendData({
      relationships: [makeRelationship({
        name: "Item", single: false, dtoKey: "estimateitems", alias: "EstimateItem",
        interfaceName: "ItemInterface", modelKebab: "item",
        interfaceImportPath: "@/features/plm/item/data/ItemInterface",
        fields: [{ name: "quantity", type: "number", tsType: "number", zodSchema: "z.number()", formComponent: "FormInputNumber", nullable: false, isContentField: false }],
      })],
    }));
    expect(out).toContain("export interface EstimateItemRelationshipMeta");
    expect(out).toContain("estimateItemMeta?:");
  });

  it("keeps readOnly fields in the interface but out of Input", () => {
    const out = generateInterfaceTemplate(makeFrontendData({
      fields: [
        { name: "name", type: "string", tsType: "string", zodSchema: "z.string()", formComponent: "FormInput", nullable: false, isContentField: false },
        { name: "effective_value", type: "number", tsType: "number", zodSchema: "z.number()", formComponent: "FormInputNumber", nullable: true, isContentField: false, readOnly: true },
      ],
    }));
    expect(out).toContain("get effective_value()");
    const inputBlock = out.split("Input = {")[1].split("};")[0];
    expect(inputBlock).not.toContain("effective_value");
  });
});
