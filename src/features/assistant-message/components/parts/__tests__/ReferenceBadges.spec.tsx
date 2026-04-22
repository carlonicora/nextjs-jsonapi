import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ApiDataInterface } from "../../../../../core";
import { AbstractApiData } from "../../../../../core/abstracts/AbstractApiData";
import { DataClassRegistry } from "../../../../../core/registry/DataClassRegistry";
import { ModuleRegistry } from "../../../../../core/registry/ModuleRegistry";
import type { ApiRequestDataTypeInterface } from "../../../../../core/interfaces/ApiRequestDataTypeInterface";
import { ReferenceBadges } from "../ReferenceBadges";

class TestAccount extends AbstractApiData {
  static identifierFields: string[] = ["name"];
  rehydrate(data: any): this {
    super.rehydrate(data);
    return this;
  }
  createJsonApi(): any {
    return {};
  }
}

const testAccountModule = {
  name: "test-accounts",
  pageUrl: "/accounts",
  model: TestAccount,
} as unknown as ApiRequestDataTypeInterface;

beforeAll(() => {
  DataClassRegistry.clear();
  DataClassRegistry.registerObjectClass(testAccountModule, TestAccount);
  ModuleRegistry.register("TestAccount" as any, testAccountModule as any);
});

afterAll(() => {
  DataClassRegistry.clear();
});

function makeRehydratedAccount({ id, name }: { id: string; name: string }): ApiDataInterface {
  const acct = new TestAccount();
  acct.rehydrate({
    jsonApi: { type: "test-accounts", id, attributes: { name } },
    included: [],
  });
  return acct as unknown as ApiDataInterface;
}

describe("ReferenceBadges", () => {
  it("renders a chip per reference with type label + identifier", () => {
    const references = [makeRehydratedAccount({ id: "acc-1", name: "Acme" })];
    render(<ReferenceBadges references={references} />);
    const link = screen.getByRole("link", { name: /acme/i });
    expect(link).toBeInTheDocument();
    expect(link.getAttribute("href")).toContain("/accounts/acc-1");
  });

  it("renders nothing for empty references", () => {
    const { container } = render(<ReferenceBadges references={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
