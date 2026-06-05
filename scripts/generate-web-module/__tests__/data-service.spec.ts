import { describe, it, expect } from "vitest";
import { makeFrontendData } from "./fixtures";
import { generateServiceTemplate } from "../templates/data/service.template";

describe("frontend data service template", () => {
  it("applies inclusions inside findOne", () => {
    const out = generateServiceTemplate(makeFrontendData());
    const findOne = out.split("static async findOne")[1].split("static async")[0];
    expect(findOne).toContain("limitToFields");
    expect(findOne).toContain("limitToType");
  });

  it("emits a patch method", () => {
    const out = generateServiceTemplate(makeFrontendData());
    expect(out).toContain("static async patch(params: { id: string } & Partial<Omit<WidgetInput, \"id\">>)");
    expect(out).toContain("method: HttpMethod.PATCH");
  });
});
