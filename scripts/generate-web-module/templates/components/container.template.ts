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
import {
  AllowedUsersDetails,
  PageContentContainer,
  RelevantContentsList,
  RelevantUsersList,
} from "@carlonicora/nextjs-jsonapi/components";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@carlonicora/nextjs-jsonapi/components";
import { useTranslations } from "next-intl";

type ${names.pascalCase}ContainerProps = {
  ${names.camelCase}: ${names.pascalCase}Interface;
};

function ${names.pascalCase}ContainerInternal({ ${names.camelCase} }: ${names.pascalCase}ContainerProps) {
  const t = useTranslations();

  return (
    <PageContentContainer
      details={<${names.pascalCase}Details />}
      footer={
        <AllowedUsersDetails showTitle content={${names.camelCase}} />
      }
      content={
        <Tabs defaultValue={\`${names.camelCase}\`}>
          <TabsList className="mb-4">
            <TabsTrigger value="${names.camelCase}">{t(\`types.${names.pluralCamel}\`, { count: 1 })}</TabsTrigger>
            <TabsTrigger value="contents">{t(\`generic.relevant\`)}</TabsTrigger>
            <TabsTrigger value="users">{t(\`generic.relevant_users\`)}</TabsTrigger>
          </TabsList>
          <TabsContent value="${names.camelCase}">
            <${names.pascalCase}Content />
          </TabsContent>
          <TabsContent value="contents">
            <RelevantContentsList id={${names.camelCase}.id} />
          </TabsContent>
          <TabsContent value="users">
            <RelevantUsersList id={${names.camelCase}.id} />
          </TabsContent>
        </Tabs>
      }
    />
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
import { PageContentContainer } from "@carlonicora/nextjs-jsonapi/components";

type ${names.pascalCase}ContainerProps = {
  ${names.camelCase}: ${names.pascalCase}Interface;
};

function ${names.pascalCase}ContainerInternal({ ${names.camelCase} }: ${names.pascalCase}ContainerProps) {
  return (
    <PageContentContainer
      details={<${names.pascalCase}Details />}
      content={
        <div className="flex w-full flex-col gap-y-4">
          {/* Add custom content sections here */}
        </div>
      }
    />
  );
}

export default function ${names.pascalCase}Container() {
  const { ${names.camelCase} } = use${names.pascalCase}Context();
  if (!${names.camelCase}) return null;

  return <${names.pascalCase}ContainerInternal ${names.camelCase}={${names.camelCase}} />;
}
`;
}
