/**
 * ListContainer Template
 *
 * Generates {Module}ListContainer.tsx component for the list page.
 */

import { FrontendTemplateData } from "../../types/template-data.interface";

/**
 * Generate the list container component file content
 *
 * @param data - Frontend template data
 * @returns Generated file content
 */
export function generateListContainerTemplate(data: FrontendTemplateData): string {
  const { names } = data;

  return `"use client";

import ${names.pascalCase}List from "@/features/${data.importTargetDir}/${names.kebabCase}/components/lists/${names.pascalCase}List";

function ${names.pascalCase}ListContainerInternal() {
  return <${names.pascalCase}List />;
}

export default function ${names.pascalCase}ListContainer() {
  return <${names.pascalCase}ListContainerInternal />;
}
`;
}
