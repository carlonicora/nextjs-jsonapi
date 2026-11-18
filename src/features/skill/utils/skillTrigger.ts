/**
 * Finds the skill trigger the caret is in: a `/` at the start of the text or
 * after whitespace, followed by the name characters typed so far, ending at
 * the caret. A slash inside a word (`and/or`, `12/03`, a path or a URL) is not
 * a trigger. The typed run must be empty or start with a letter, as skill
 * names do (the same boundary rule the server uses to find a named skill).
 */
export function findSkillTrigger(text: string, caret: number): { start: number; query: string } | null {
  if (caret < 1 || caret > text.length) return null;
  const before = text.slice(0, caret);
  const match = /(^|\s)\/([a-z0-9-]*)$/.exec(before);
  if (!match) return null;
  const query = match[2];
  if (query.length > 0 && !/^[a-z]/.test(query)) return null;
  return { start: caret - query.length - 1, query };
}

/** The skills whose name starts with `query`. An empty query keeps them all. */
export function filterSkills<T extends { name: string }>(skills: T[], query: string): T[] {
  if (!query) return skills;
  return skills.filter((skill) => skill.name.startsWith(query));
}
