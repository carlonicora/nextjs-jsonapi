import { describe, it, expect } from "vitest";
import { AbstractApiData } from "../AbstractApiData";
import { JsonApiHydratedDataInterface } from "../../interfaces/JsonApiHydratedDataInterface";

// Concrete test subclass — uses default identifierFields ["name"]
class DefaultModel extends AbstractApiData {
  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    return this;
  }
}

// Subclass with custom identifierFields
class PersonModel extends AbstractApiData {
  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    return this;
  }
}
// Simulate what ModuleFactory does at registration time
(PersonModel as any).identifierFields = ["first_name", "last_name"];

// Subclass with single non-name field
class OrderModel extends AbstractApiData {
  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    return this;
  }
}
(OrderModel as any).identifierFields = ["number"];

function makeHydratedData(attributes: Record<string, any>): JsonApiHydratedDataInterface {
  return {
    jsonApi: {
      type: "test",
      id: "1",
      attributes,
    },
    included: [],
  };
}

describe("AbstractApiData.identifier", () => {
  it("returns name attribute by default", () => {
    const model = new DefaultModel();
    model.rehydrate(makeHydratedData({ name: "Acme Corp" }));
    expect(model.identifier).toBe("Acme Corp");
  });

  it("joins multiple fields with a space", () => {
    const model = new PersonModel();
    model.rehydrate(makeHydratedData({ first_name: "John", last_name: "Doe" }));
    expect(model.identifier).toBe("John Doe");
  });

  it("filters out null fields", () => {
    const model = new PersonModel();
    model.rehydrate(makeHydratedData({ first_name: null, last_name: "Doe" }));
    expect(model.identifier).toBe("Doe");
  });

  it("filters out undefined fields", () => {
    const model = new PersonModel();
    model.rehydrate(makeHydratedData({ last_name: "Doe" }));
    expect(model.identifier).toBe("Doe");
  });

  it("filters out empty string fields", () => {
    const model = new PersonModel();
    model.rehydrate(makeHydratedData({ first_name: "", last_name: "Doe" }));
    expect(model.identifier).toBe("Doe");
  });

  it("preserves numeric zero values", () => {
    class ZeroModel extends AbstractApiData {
      rehydrate(data: JsonApiHydratedDataInterface): this {
        super.rehydrate(data);
        return this;
      }
    }
    (ZeroModel as any).identifierFields = ["quantity"];
    const model = new ZeroModel();
    model.rehydrate(makeHydratedData({ quantity: 0 }));
    expect(model.identifier).toBe("0");
  });

  it("returns single non-name field", () => {
    const model = new OrderModel();
    model.rehydrate(makeHydratedData({ number: "ORD-001" }));
    expect(model.identifier).toBe("ORD-001");
  });

  it("returns empty string when not rehydrated", () => {
    const model = new DefaultModel();
    expect(model.identifier).toBe("");
  });

  it("returns empty string when attribute is missing", () => {
    const model = new DefaultModel();
    model.rehydrate(makeHydratedData({}));
    expect(model.identifier).toBe("");
  });

  it("does not share identifierFields between subclasses", () => {
    const defaultModel = new DefaultModel();
    const personModel = new PersonModel();
    const orderModel = new OrderModel();

    defaultModel.rehydrate(makeHydratedData({ name: "Test" }));
    personModel.rehydrate(makeHydratedData({ first_name: "John", last_name: "Doe" }));
    orderModel.rehydrate(makeHydratedData({ number: "ORD-001" }));

    expect(defaultModel.identifier).toBe("Test");
    expect(personModel.identifier).toBe("John Doe");
    expect(orderModel.identifier).toBe("ORD-001");
  });
});
