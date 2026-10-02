"use client";

import { ModuleRegistry } from "../../../core/registry/ModuleRegistry";
import { usePageUrlGenerator } from "../../../hooks";
import { Link } from "../../../shadcnui";
import type { MentionRenderer } from "./MessageItem";

function EntityMentionLinkView({ type, id, alias }: { type: string; id: string; alias: string }) {
  const generate = usePageUrlGenerator();

  let module;
  try {
    module = ModuleRegistry.findByName(type);
  } catch {
    return <>{alias}</>;
  }
  if (!module?.pageUrl) return <>{alias}</>;

  return <Link href={generate({ page: module, id })}>{alias}</Link>;
}

/**
 * Default mention renderer for assistant answers: a `mention://<type>/<id>`
 * link becomes a link to the entity's page when `<type>` is a registered
 * module with a `pageUrl`, and plain text otherwise. Rendered as a component
 * so the URL hook runs inside React's component tree.
 */
export const EntityMentionLink: MentionRenderer = (p) => <EntityMentionLinkView {...p} />;
