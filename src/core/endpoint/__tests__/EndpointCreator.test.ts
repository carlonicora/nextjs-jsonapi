import { describe, it, expect } from "vitest";
import { EndpointCreator } from "../EndpointCreator";
import { createMockModule } from "../../../testing";

describe("EndpointCreator", () => {
  describe("basic URL generation", () => {
    it("should generate URL from string endpoint", () => {
      const creator = new EndpointCreator({ endpoint: "articles" });
      expect(creator.generate()).toBe("articles");
    });

    it("should generate URL from module endpoint", () => {
      const mockModule = createMockModule({ name: "articles" });
      const creator = new EndpointCreator({ endpoint: mockModule });
      expect(creator.generate()).toBe("articles");
    });

    it("should include id in URL", () => {
      const creator = new EndpointCreator({ endpoint: "articles", id: "123" });
      expect(creator.generate()).toBe("articles/123");
    });

    it("should include child endpoint", () => {
      const creator = new EndpointCreator({
        endpoint: "articles",
        id: "123",
        childEndpoint: "comments",
      });
      expect(creator.generate()).toBe("articles/123/comments");
    });

    it("should include child id", () => {
      const creator = new EndpointCreator({
        endpoint: "articles",
        id: "123",
        childEndpoint: "comments",
        childId: "456",
      });
      expect(creator.generate()).toBe("articles/123/comments/456");
    });
  });

  describe("fluent API", () => {
    it("should support chaining endpoint()", () => {
      const creator = new EndpointCreator({ endpoint: "initial" });
      const result = creator.endpoint("articles");
      expect(result).toBe(creator);
      expect(creator.generate()).toBe("articles");
    });

    it("should support chaining id()", () => {
      const creator = new EndpointCreator({ endpoint: "articles" });
      const result = creator.id("123");
      expect(result).toBe(creator);
      expect(creator.generate()).toBe("articles/123");
    });

    it("should support chaining childEndpoint()", () => {
      const creator = new EndpointCreator({ endpoint: "articles", id: "123" });
      const result = creator.childEndpoint("comments");
      expect(result).toBe(creator);
      expect(creator.generate()).toBe("articles/123/comments");
    });

    it("should support chaining childId()", () => {
      const creator = new EndpointCreator({
        endpoint: "articles",
        id: "123",
        childEndpoint: "comments",
      });
      const result = creator.childId("456");
      expect(result).toBe(creator);
      expect(creator.generate()).toBe("articles/123/comments/456");
    });

    it("should support full fluent chain", () => {
      const creator = new EndpointCreator({ endpoint: "articles" }).id("123").childEndpoint("comments").childId("456");
      expect(creator.generate()).toBe("articles/123/comments/456");
    });
  });

  describe("query parameters", () => {
    it("should add additional params", () => {
      const creator = new EndpointCreator({
        endpoint: "articles",
        additionalParams: [{ key: "page", value: "1" }],
      });
      expect(creator.generate()).toBe("articles?page=1");
    });

    it("should support addAdditionalParam()", () => {
      const creator = new EndpointCreator({ endpoint: "articles" });
      creator.addAdditionalParam("page", "1");
      creator.addAdditionalParam("limit", "10");
      expect(creator.generate()).toBe("articles?page=1&limit=10");
    });

    it("should support array values in params", () => {
      const creator = new EndpointCreator({ endpoint: "articles" });
      creator.addAdditionalParam("filter", ["tag1", "tag2"]);
      expect(creator.generate()).toBe("articles?filter=tag1,tag2");
    });

    it("should combine URL and params", () => {
      const creator = new EndpointCreator({
        endpoint: "articles",
        id: "123",
      });
      creator.addAdditionalParam("include", "author");
      expect(creator.generate()).toBe("articles/123?include=author");
    });
  });

  describe("limitToType", () => {
    it("should add include param with single type", () => {
      const creator = new EndpointCreator({ endpoint: "articles" });
      creator.limitToType(["author"]);
      expect(creator.generate()).toBe("articles?include=author");
    });

    it("should add include param with multiple types", () => {
      const creator = new EndpointCreator({ endpoint: "articles" });
      creator.limitToType(["author", "comments", "tags"]);
      expect(creator.generate()).toBe("articles?include=author,comments,tags");
    });
  });

  describe("limitToFields", () => {
    it("should add fields param with single selector", () => {
      const creator = new EndpointCreator({ endpoint: "articles" });
      creator.limitToFields([{ type: "articles", fields: ["title", "body"] }]);
      expect(creator.generate()).toBe("articles?fields[articles]=title,body");
    });

    it("should add fields param with multiple selectors", () => {
      const creator = new EndpointCreator({ endpoint: "articles" });
      creator.limitToFields([
        { type: "articles", fields: ["title", "body"] },
        { type: "authors", fields: ["name", "email"] },
      ]);
      expect(creator.generate()).toBe("articles?fields[articles]=title,body&fields[authors]=name,email");
    });

    it("should handle empty selectors array", () => {
      const creator = new EndpointCreator({ endpoint: "articles" });
      creator.limitToFields([]);
      expect(creator.generate()).toBe("articles");
    });
  });

  describe("module endpoint support", () => {
    it("should work with module as child endpoint", () => {
      const parentModule = createMockModule({ name: "users" });
      const childModule = createMockModule({ name: "posts" });
      const creator = new EndpointCreator({
        endpoint: parentModule,
        id: "1",
        childEndpoint: childModule,
      });
      expect(creator.generate()).toBe("users/1/posts");
    });
  });
});
