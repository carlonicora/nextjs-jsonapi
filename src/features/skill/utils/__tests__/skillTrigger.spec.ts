import { describe, it, expect } from "vitest";
import { filterSkills, findSkillTrigger } from "../skillTrigger";

describe("findSkillTrigger", () => {
  it("finds a slash token that ends at the caret", () => {
    expect(findSkillTrigger("/", 1)).toEqual({ start: 0, query: "" });
    expect(findSkillTrigger("send an /em", 11)).toEqual({ start: 8, query: "em" });
    expect(findSkillTrigger("line\n/qu", 8)).toEqual({ start: 5, query: "qu" });
    expect(findSkillTrigger("/em", 1)).toEqual({ start: 0, query: "" }); // caret right after the slash
  });

  it("ignores a slash inside ordinary text", () => {
    expect(findSkillTrigger("and/or", 6)).toBeNull();
    expect(findSkillTrigger("12/03", 5)).toBeNull();
    expect(findSkillTrigger("src/app/page.tsx", 16)).toBeNull();
    expect(findSkillTrigger("https://example.com", 19)).toBeNull();
  });

  it("answers null when the caret is past the token or the token is not a valid name start", () => {
    expect(findSkillTrigger("/email done", 11)).toBeNull(); // caret is past the token
    expect(findSkillTrigger("/Em", 3)).toBeNull(); // not a valid name start
    expect(findSkillTrigger("/1a", 3)).toBeNull();
    expect(findSkillTrigger("", 0)).toBeNull();
  });
});

describe("filterSkills", () => {
  const skills = [{ name: "email" }, { name: "embed" }, { name: "quote" }];

  it("filters by name prefix", () => {
    expect(filterSkills(skills, "em").map((s) => s.name)).toEqual(["email", "embed"]);
    expect(filterSkills(skills, "")).toHaveLength(3);
    expect(filterSkills(skills, "mail")).toEqual([]); // prefix only
  });
});
