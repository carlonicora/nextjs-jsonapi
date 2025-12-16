/**
 * Deleter Template
 *
 * Generates {Module}Deleter.tsx component for delete confirmation.
 */

import { FrontendTemplateData } from "../../types/template-data.interface";

/**
 * Generate the deleter component file content
 *
 * @param data - Frontend template data
 * @returns Generated file content
 */
export function generateDeleterTemplate(data: FrontendTemplateData): string {
  const { names } = data;

  return `"use client";

import { ${names.pascalCase}Interface } from "@/features/${data.targetDir}/${names.kebabCase}/data/${names.pascalCase}Interface";
import { ${names.pascalCase}Service } from "@/features/${data.targetDir}/${names.kebabCase}/data/${names.pascalCase}Service";
import { CommonDeleter } from "@carlonicora/nextjs-jsonapi/components";
import { usePageUrlGenerator } from "@carlonicora/nextjs-jsonapi/client";

import { Modules } from "@carlonicora/nextjs-jsonapi/core";
import { useTranslations } from "next-intl";

type ${names.pascalCase}DeleterProps = {
  ${names.camelCase}: ${names.pascalCase}Interface;
};

function ${names.pascalCase}DeleterInternal({ ${names.camelCase} }: ${names.pascalCase}DeleterProps) {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();

  if (!${names.camelCase}) return null;

  return (
    <CommonDeleter
      type={\`${names.pluralKebab}\`}
      deleteFunction={() => ${names.pascalCase}Service.delete({ ${names.camelCase}Id: ${names.camelCase}.id })}
      redirectTo={generateUrl({ page: Modules.${names.pascalCase} })}
    />
  );
}

export default function ${names.pascalCase}Deleter(props: ${names.pascalCase}DeleterProps) {
  return <${names.pascalCase}DeleterInternal {...props} />;
}
`;
}
