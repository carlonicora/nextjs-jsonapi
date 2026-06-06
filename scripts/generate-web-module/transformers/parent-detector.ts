/**
 * Parent Class Detector
 *
 * Determines whether a module should extend Content or AbstractApiData
 * based on the presence of Content-specific fields or explicit configuration.
 */

import { JsonFieldDefinition } from "../types/json-schema.interface";

/**
 * Check if a module should extend the Content base.
 *
 * Opt-in ONLY: a module extends Content solely when the schema explicitly sets
 * `extendsContent: true`. The previous heuristic auto-enabled it whenever a
 * `name` (or `tldr`/`abstract`) field was present — i.e. for almost every
 * entity — which forced apps that have no Content base feature to import one
 * that doesn't exist. Rich-text editing no longer depends on Content: use a
 * field of `type: "blocknote"` to get a BlockNote editor on a standalone model.
 *
 * @param _fields - Field definitions (unused; kept for signature stability)
 * @param explicitValue - Explicit `extendsContent` value from the JSON schema
 * @returns true only when explicitly opted in
 */
export function detectExtendsContent(_fields: JsonFieldDefinition[], explicitValue?: boolean): boolean {
  return explicitValue === true;
}

/**
 * Get the parent class name based on detection result
 *
 * @param extendsContent - Whether the module extends Content
 * @returns Parent class name
 */
export function getParentClassName(extendsContent: boolean): string {
  return extendsContent ? "Content" : "AbstractApiData";
}

/**
 * Get the parent interface name based on detection result
 *
 * @param extendsContent - Whether the module extends Content
 * @returns Parent interface name
 */
export function getParentInterfaceName(extendsContent: boolean): string {
  return extendsContent ? "ContentInterface" : "BaseInterface";
}

/**
 * Get the parent input type name based on detection result
 *
 * @param extendsContent - Whether the module extends Content
 * @returns Parent input type or null if standalone
 */
export function getParentInputType(extendsContent: boolean): string | null {
  return extendsContent ? "ContentInput" : null;
}

/**
 * Get the import path for the parent class
 *
 * @param extendsContent - Whether the module extends Content
 * @returns Import path for parent class
 */
export function getParentClassImport(extendsContent: boolean): string {
  if (extendsContent) {
    return '@carlonicora/nextjs-jsonapi/core';
  }
  return '@carlonicora/nextjs-jsonapi/core';
}

/**
 * Check if the module needs to call super.addContentInput() in createJsonApi
 *
 * @param extendsContent - Whether the module extends Content
 * @returns true if super.addContentInput() should be called
 */
export function needsAddContentInput(extendsContent: boolean): boolean {
  return extendsContent;
}

/**
 * Get fields that are inherited from Content and should not be declared
 *
 * @param extendsContent - Whether the module extends Content
 * @returns Array of field names to exclude from generation
 */
export function getInheritedFields(extendsContent: boolean): string[] {
  if (extendsContent) {
    // These fields are already in Content, don't redeclare them
    return ["name", "tldr", "abstract", "relevance"];
  }
  return [];
}
