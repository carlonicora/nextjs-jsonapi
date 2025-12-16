/**
 * List Page Template
 *
 * Generates the list page for the module at [locale]/(main)/(features)/{plural}/page.tsx
 */

import { FrontendTemplateData } from "../../types/template-data.interface";

/**
 * Generate the list page file content
 *
 * @param data - Frontend template data
 * @returns Generated file content
 */
export function generateListPageTemplate(data: FrontendTemplateData): string {
  const { names } = data;

  return `import ${names.pascalCase}ListContainer from "@/features/${data.targetDir}/${names.kebabCase}/components/containers/${names.pascalCase}ListContainer";
import { ${names.pascalCase}Provider } from "@/features/${data.targetDir}/${names.kebabCase}/contexts/${names.pascalCase}Context";
import { PageContainer } from "@carlonicora/nextjs-jsonapi/components";
import { Modules } from "@carlonicora/nextjs-jsonapi/core";
import { Action } from "@carlonicora/nextjs-jsonapi/core";
import { ServerSession } from "@carlonicora/nextjs-jsonapi/server";

export default async function ${names.pluralPascal}ListPage() {
  ServerSession.checkPermission({ module: Modules.${names.pascalCase}, action: Action.Read });

  return (
    <${names.pascalCase}Provider>
      <PageContainer testId="page-${names.pluralKebab}-container">
        <${names.pascalCase}ListContainer />
      </PageContainer>
    </${names.pascalCase}Provider>
  );
}
`;
}
