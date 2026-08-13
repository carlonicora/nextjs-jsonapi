import { describe, expect, it } from "vitest";
import { isRemoteImageSrc } from "./isRemoteImageSrc";

describe("isRemoteImageSrc", () => {
  it("returns true for an https URL", () => {
    expect(isRemoteImageSrc("https://cdn.discordapp.com/avatars/123/abc.png")).toBe(true);
  });

  it("returns true for an http URL", () => {
    expect(isRemoteImageSrc("http://minio.narr8.test:9000/bucket/key.png")).toBe(true);
  });

  it("returns false for a blob URL", () => {
    expect(isRemoteImageSrc("blob:http://narr8.test:3951/2f8c-4a")).toBe(false);
  });

  it("returns false for a data URL", () => {
    expect(isRemoteImageSrc("data:image/png;base64,iVBORw0KGgo=")).toBe(false);
  });

  it("returns false for an app-relative path", () => {
    expect(isRemoteImageSrc("/logo.webp")).toBe(false);
  });

  it("returns false for an empty or missing src", () => {
    expect(isRemoteImageSrc("")).toBe(false);
    expect(isRemoteImageSrc(undefined)).toBe(false);
  });
});
