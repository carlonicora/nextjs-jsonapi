/**
 * Content Template
 *
 * Generates {Module}Content.tsx component for displaying BlockNote content.
 * Only generated for Content-extending modules.
 */

import { FrontendTemplateData } from "../../types/template-data.interface";

/**
 * Generate the content display component file content
 *
 * @param data - Frontend template data
 * @returns Generated file content or null if not Content-extending
 */
export function generateContentTemplate(data: FrontendTemplateData): string | null {
  const { names, extendsContent } = data;

  // Only generate for Content-extending modules
  if (!extendsContent) {
    return null;
  }

  return `"use client";

import { use${names.pascalCase}Context } from "@/features/${data.targetDir}/${names.kebabCase}/contexts/${names.pascalCase}Context";
import { BlockNoteEditorContainer } from "@carlonicora/nextjs-jsonapi/components";
import { Card } from "@carlonicora/nextjs-jsonapi/shadcnui";

export default function ${names.pascalCase}Content() {
  const { ${names.camelCase} } = use${names.pascalCase}Context();

  return (
    <Card className="flex w-full flex-col p-4">
      <BlockNoteEditorContainer id={${names.camelCase}.id} type="${names.camelCase}" initialContent={${names.camelCase}.content} />
    </Card>
  );
}
`;
}
