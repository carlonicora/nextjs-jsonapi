"use client";

import SkillList from "../lists/SkillList";

/**
 * The company's skills list, bare: Settings mounts its sections without a page
 * container (as Wyrdli's CalendarListContainer).
 */
export default function SkillListContainer() {
  return <SkillList scope="company" />;
}
