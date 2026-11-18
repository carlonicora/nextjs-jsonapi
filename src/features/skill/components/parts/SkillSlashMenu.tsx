"use client";

import type { SkillInterface } from "../../data/SkillInterface";
import { filterSkills } from "../../utils/skillTrigger";

interface Props {
  skills: SkillInterface[];
  query: string;
  activeIndex: number;
  onPick: (skill: SkillInterface) => void;
}

/**
 * The `/` menu of the plain message box. A plain list positioned above the
 * textarea, not a Popover or cmdk: both take focus out of the textarea, and the
 * composer owns the keyboard (arrows, Enter, Escape) and the active row.
 */
export function SkillSlashMenu({ skills, query, activeIndex, onPick }: Props) {
  const matches = filterSkills(skills, query);
  if (matches.length === 0) return null;

  return (
    <div
      role="listbox"
      data-testid="skill-menu"
      className="bg-popover text-popover-foreground absolute start-0 bottom-full z-50 mb-1 max-h-64 w-full max-w-sm overflow-y-auto rounded-md border p-1 shadow-md"
    >
      {matches.map((skill, index) => {
        const selected = index === activeIndex;
        return (
          <div
            key={skill.id}
            role="option"
            aria-selected={selected}
            data-testid={`skill-menu-item-${skill.name}`}
            // Keep the caret in the textarea: a mousedown here would blur it.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onPick(skill)}
            className={`hover:bg-muted flex cursor-pointer flex-col gap-0.5 rounded-sm px-2 py-1.5${selected ? " bg-muted" : ""}`}
          >
            <span className="text-xs">/{skill.name}</span>
            {skill.description && <span className="text-muted-foreground text-xs/relaxed">{skill.description}</span>}
          </div>
        );
      })}
    </div>
  );
}
