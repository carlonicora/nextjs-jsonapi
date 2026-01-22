/**
 * Detail Page Template
 *
 * Generates the detail page for the module at [locale]/(main)/(features)/{plural}/[id]/page.tsx
 */

import { FrontendTemplateData } from "../../types/template-data.interface";

/**
 * Generate the detail page file content
 *
 * @param data - Frontend template data
 * @returns Generated file content
 */
export function generateDetailPageTemplate(data: FrontendTemplateData): string {
  const { names } = data;

  return `import ${names.pascalCase}Container from "@/features/${data.importTargetDir}/${names.kebabCase}/components/containers/${names.pascalCase}Container";
import { ${names.pascalCase}Provider } from "@/features/${data.importTargetDir}/${names.kebabCase}/contexts/${names.pascalCase}Context";
import { ${names.pascalCase}Interface } from "@/features/${data.importTargetDir}/${names.kebabCase}/data/${names.pascalCase}Interface";
import { ${names.pascalCase}Service } from "@/features/${data.importTargetDir}/${names.kebabCase}/data/${names.pascalCase}Service";
import { generateSpecificMetadata } from "@/utils/metadata";
import { PageContainer } from "@carlonicora/nextjs-jsonapi/components";
import { Modules } from "@carlonicora/nextjs-jsonapi/core";
import { Action } from "@carlonicora/nextjs-jsonapi/core";
import { ServerSession } from "@carlonicora/nextjs-jsonapi/server";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cache } from "react";

const getCached${names.pascalCase} = cache(async (id: string) => ${names.pascalCase}Service.findOne({ id }));

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations();

  const ${names.camelCase}: ${names.pascalCase}Interface = await getCached${names.pascalCase}(params.id);

  const title = (await ServerSession.hasPermissionToModule({
    module: Modules.${names.pascalCase},
    action: Action.Read,
    data: ${names.camelCase},
  }))
    ? \`[\${t(\`types.${names.pluralCamel}\`, { count: 1 })}] \${${names.camelCase}.name}\`
    : \`\${t(\`types.${names.pluralCamel}\`, { count: 1 })}\`;

  return await generateSpecificMetadata({ title: title });
}

export default async function ${names.pascalCase}Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const ${names.camelCase}: ${names.pascalCase}Interface = await getCached${names.pascalCase}(params.id);

  await ServerSession.checkPermission({ module: Modules.${names.pascalCase}, action: Action.Read, data: ${names.camelCase} });

  return (
    <${names.pascalCase}Provider dehydrated${names.pascalCase}={${names.camelCase}.dehydrate()}>
      <PageContainer>
        <${names.pascalCase}Container />
      </PageContainer>
    </${names.pascalCase}Provider>
  );
}
`;
}
