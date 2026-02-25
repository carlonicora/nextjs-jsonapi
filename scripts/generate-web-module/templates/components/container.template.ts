/**
 * Container Template
 *
 * Generates {Module}Container.tsx component for displaying item detail page.
 */

import { FrontendTemplateData } from "../../types/template-data.interface";

/**
 * Generate the container component file content
 *
 * @param data - Frontend template data
 * @returns Generated file content
 */
export function generateContainerTemplate(data: FrontendTemplateData): string {
  const { names, extendsContent } = data;

  // Content-extending modules get full tabs with relevant content/users
  if (extendsContent) {
    return generateContentContainerTemplate(data);
  }

  // Non-content modules get simpler container
  return generateSimpleContainerTemplate(data);
}

/**
 * Generate container for Content-extending modules
 */
function generateContentContainerTemplate(data: FrontendTemplateData): string {
  const { names } = data;

  return `"use client";

import ${names.pascalCase}Content from "@/features/${data.importTargetDir}/${names.kebabCase}/components/details/${names.pascalCase}Content";
import ${names.pascalCase}Details from "@/features/${data.importTargetDir}/${names.kebabCase}/components/details/${names.pascalCase}Details";
import { use${names.pascalCase}Context } from "@/features/${data.importTargetDir}/${names.kebabCase}/contexts/${names.pascalCase}Context";
import { ${names.pascalCase}Interface } from "@/features/${data.importTargetDir}/${names.kebabCase}/data/${names.pascalCase}Interface";
import { RoundPageContainer } from "@carlonicora/nextjs-jsonapi/components";
import { Modules } from "@carlonicora/nextjs-jsonapi/core";

type ${names.pascalCase}ContainerProps = {
  ${names.camelCase}: ${names.pascalCase}Interface;
};

function ${names.pascalCase}ContainerInternal({ ${names.camelCase} }: ${names.pascalCase}ContainerProps) {
  return (
    <RoundPageContainer module={Modules.${names.pascalCase}} details={<${names.pascalCase}Details />}>
      <${names.pascalCase}Content />
    </RoundPageContainer>
  );
}

export default function ${names.pascalCase}Container() {
  const { ${names.camelCase} } = use${names.pascalCase}Context();
  if (!${names.camelCase}) return null;

  return <${names.pascalCase}ContainerInternal ${names.camelCase}={${names.camelCase}} />;
}
`;
}

/**
 * Generate container for non-Content modules
 */
function generateSimpleContainerTemplate(data: FrontendTemplateData): string {
  const { names } = data;

  return `"use client";

import ${names.pascalCase}Details from "@/features/${data.importTargetDir}/${names.kebabCase}/components/details/${names.pascalCase}Details";
import { use${names.pascalCase}Context } from "@/features/${data.importTargetDir}/${names.kebabCase}/contexts/${names.pascalCase}Context";
import { ${names.pascalCase}Interface } from "@/features/${data.importTargetDir}/${names.kebabCase}/data/${names.pascalCase}Interface";
import { RoundPageContainer } from "@carlonicora/nextjs-jsonapi/components";
import { Modules } from "@carlonicora/nextjs-jsonapi/core";

type ${names.pascalCase}ContainerProps = {
  ${names.camelCase}: ${names.pascalCase}Interface;
};

function ${names.pascalCase}ContainerInternal({ ${names.camelCase} }: ${names.pascalCase}ContainerProps) {
  return (
    <RoundPageContainer module={Modules.${names.pascalCase}} details={<${names.pascalCase}Details />}>
      <div className="flex w-full flex-col gap-y-4">
        {/* Add custom content sections here */}
      </div>
    </RoundPageContainer>
  );
}

export default function ${names.pascalCase}Container() {
  const { ${names.camelCase} } = use${names.pascalCase}Context();
  if (!${names.camelCase}) return null;

  return <${names.pascalCase}ContainerInternal ${names.camelCase}={${names.camelCase}} />;
}
`;
}
