/**
 * Container Template
 *
 * Generates {Module}Container.tsx component for displaying item detail page.
 * Uses the tabs pattern with {Module}Content as first tab.
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

  if (extendsContent) {
    return generateContentContainerTemplate(data);
  }

  return generateSimpleContainerTemplate(data);
}

/**
 * Generate container for Content-extending modules (tabs with Details sidebar + Content)
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
 * Generate container for non-Content modules (tabs pattern with {Module}Content)
 */
function generateSimpleContainerTemplate(data: FrontendTemplateData): string {
  const { names } = data;

  return `"use client";

import { ${names.pascalCase}Content } from "@/features/${data.importTargetDir}/${names.kebabCase}/components/details/${names.pascalCase}Content";
import { use${names.pascalCase}Context } from "@/features/${data.importTargetDir}/${names.kebabCase}/contexts/${names.pascalCase}Context";
import { RoundPageContainer, Tab } from "@carlonicora/nextjs-jsonapi/components";
import { Modules } from "@carlonicora/nextjs-jsonapi/core";

function ${names.pascalCase}ContainerInternal() {
  const { ${names.camelCase} } = use${names.pascalCase}Context();
  if (!${names.camelCase}) return null;

  const tabs: Tab[] = [
    {
      label: "Details",
      content: <${names.pascalCase}Content ${names.camelCase}={${names.camelCase}} />,
    },
  ];

  return <RoundPageContainer module={Modules.${names.pascalCase}} id={${names.camelCase}.id} tabs={tabs} />;
}

export default function ${names.pascalCase}Container() {
  const { ${names.camelCase} } = use${names.pascalCase}Context();
  if (!${names.camelCase}) return null;

  return <${names.pascalCase}ContainerInternal />;
}
`;
}
