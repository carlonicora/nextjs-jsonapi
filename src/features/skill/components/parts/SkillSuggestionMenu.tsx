"use client";

import type { DefaultReactSuggestionItem, SuggestionMenuProps } from "@blocknote/react";

/**
 * One row of the rich message box's `/` menu. Skill names are unique per
 * caller, but rows are still keyed on the skill id, never on the title.
 */
export type SkillSuggestionItem = DefaultReactSuggestionItem & {
  id: string;
  skillName: string;
};

/**
 * The `/` menu of the rich (BlockNote) message box, passed to BlockNote's
 * `SuggestionMenuController` as its `suggestionMenuComponent`. BlockNote owns
 * the keyboard and the selected row; this only draws the list. The root
 * carries `bn-suggestion-menu`, which the composer's Enter capture looks for
 * so Enter picks a row instead of sending.
 */
export function SkillSuggestionMenu({ items, selectedIndex, onItemClick }: SuggestionMenuProps<SkillSuggestionItem>) {
  if (items.length === 0) return null;

  return (
    <div
      role="listbox"
      data-testid="skill-menu"
      className="bn-suggestion-menu bg-popover text-popover-foreground z-50 max-h-64 min-w-64 max-w-sm overflow-y-auto rounded-md border p-1 shadow-md"
    >
      {items.map((item, index) => {
        const selected = index === selectedIndex;
        return (
          <div
            key={item.id}
            role="option"
            aria-selected={selected}
            data-testid={`skill-menu-item-${item.skillName}`}
            onClick={() => onItemClick?.(item)}
            className={`hover:bg-muted flex cursor-pointer flex-col gap-0.5 rounded-sm px-2 py-1.5${selected ? " bg-muted" : ""}`}
          >
            <span className="text-xs">{item.title}</span>
            {item.subtext && <span className="text-muted-foreground text-xs/relaxed">{item.subtext}</span>}
          </div>
        );
      })}
    </div>
  );
}
