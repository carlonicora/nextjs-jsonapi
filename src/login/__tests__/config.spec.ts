import { describe, expect, it } from "vitest";
import { configureLogin, isCompanyNameRequired } from "../index";

describe("login config — requireCompanyName", () => {
  it("isCompanyNameRequired defaults to true", () => {
    configureLogin({});
    expect(isCompanyNameRequired()).toBe(true);
  });

  it("requireCompanyName false hides the company field", () => {
    configureLogin({ requireCompanyName: false });
    expect(isCompanyNameRequired()).toBe(false);
  });

  it("a later configureLogin without the option restores the default", () => {
    configureLogin({ requireCompanyName: false });
    expect(isCompanyNameRequired()).toBe(false);
    configureLogin({});
    expect(isCompanyNameRequired()).toBe(true);
  });
});
