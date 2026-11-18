"use client";

import { Badge } from "../../../../shadcnui";

/** The skills an Assistant answer used, one label each, shown under the answer. */
export function MessageSkillLabels({ names }: { names: string[] }) {
  if (!names || names.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1" data-testid="message-skill-labels">
      {names.map((name) => (
        <Badge key={name} variant="softGray" data-testid={`message-skill-label-${name}`}>
          {name}
        </Badge>
      ))}
    </div>
  );
}
