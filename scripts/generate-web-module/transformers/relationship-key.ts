import { FrontendRelationship } from "../types/template-data.interface";
import { toKebabCase, pluralize } from "./name-transformer";

/** JSON:API wire key for a relationship. Schema dtoKey wins; otherwise derive
 *  identically to the backend mapper so both sides of the wire agree. */
export function resolveRelationshipKey(rel: FrontendRelationship): string {
  if (rel.dtoKey) return rel.dtoKey;
  // NOTE: Author relationships are normally NOT serialized through this helper — the backend
  // special-cases Author via contextKey/currentUser and the model template skips Author
  // serialization, so callers must not rely on this helper for Author wire keys.
  if (rel.variant) {
    return rel.single ? rel.variant.toLowerCase() : pluralize(rel.variant.toLowerCase());
  }
  if (rel.alias) {
    return rel.single ? toKebabCase(rel.alias) : pluralize(toKebabCase(rel.alias));
  }
  return rel.single ? rel.name.toLowerCase() : pluralize(rel.name.toLowerCase());
}
