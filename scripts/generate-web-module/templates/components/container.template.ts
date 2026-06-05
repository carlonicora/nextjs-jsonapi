/**
 * Container Template
 *
 * Generates {Module}Container.tsx component for the item detail page.
 *
 * Emits a RoundPageContainer driven by a `tabs` array: a default "Details" tab
 * rendering {Module}Content, one tab per configured relation list, and an
 * optional "Activity" tab. The default export gates on delete permission.
 */

import { pluralize, toCamelCase, toKebabCase } from "../../transformers/name-transformer";
import { FrontendTemplateData } from "../../types/template-data.interface";

/**
 * Generate the container component file content
 *
 * @param data - Frontend template data
 * @returns Generated file content
 */
export function generateContainerTemplate(data: FrontendTemplateData): string {
  const { names, containerTabs } = data;
  const camel = names.camelCase;

  const relationImports: string[] = [];
  const relationTabs: string[] = [];
  for (const rel of containerTabs.relations) {
    const relKebab = toKebabCase(rel.module);
    const relPluralCamel = pluralize(toCamelCase(rel.module));
    relationImports.push(
      `import ${rel.module}List from "@/features/${rel.directory}/${relKebab}/components/lists/${rel.module}List";`,
    );
    relationTabs.push(
      `    {\n      key: Modules.${rel.module},\n      label: t(\`entities.${relPluralCamel.toLowerCase()}\`, { count: 2 }),\n      content: <${rel.module}List ${rel.listProp}={${camel}} />,\n    },`,
    );
  }

  const tabEntries: string[] = [
    `    {\n      label: "Details",\n      content: <${names.pascalCase}Content ${camel}={${camel}} />,\n    },`,
    ...relationTabs,
  ];

  if (containerTabs.activity) {
    tabEntries.push(
      `    {\n      label: "Activity",\n      content: <ActivityFeed module={Modules.${names.pascalCase}} entityId={${camel}.id} />,\n    },`,
    );
  }

  const activityImport = containerTabs.activity
    ? `import ActivityFeed from "@/features/activity/activity-feed/components/ActivityFeed";\n`
    : "";
  const relationImportBlock = relationImports.length ? `${relationImports.join("\n")}\n` : "";

  return `"use client";

${activityImport}${relationImportBlock}import { ${names.pascalCase}Content } from "@/features/${data.importTargetDir}/${names.kebabCase}/components/details/${names.pascalCase}Content";
import { use${names.pascalCase}Context } from "@/features/${data.importTargetDir}/${names.kebabCase}/contexts/${names.pascalCase}Context";
import { ${names.pascalCase}Interface } from "@/features/${data.importTargetDir}/${names.kebabCase}/data/${names.pascalCase}Interface";
import { RoundPageContainer, Tab } from "@carlonicora/nextjs-jsonapi/components";
import { useCurrentUserContext } from "@carlonicora/nextjs-jsonapi/contexts";
import { Action, Modules } from "@carlonicora/nextjs-jsonapi/core";
import { useTranslations } from "next-intl";

type ${names.pascalCase}ContainerProps = { ${camel}: ${names.pascalCase}Interface };

function ${names.pascalCase}ContainerInternal({ ${camel} }: ${names.pascalCase}ContainerProps) {
  const t = useTranslations();

  const tabs: Tab[] = [
${tabEntries.join("\n")}
  ];

  return <RoundPageContainer module={Modules.${names.pascalCase}} id={${camel}.id} tabs={tabs} />;
}

export default function ${names.pascalCase}Container() {
  const { hasPermissionToModule } = useCurrentUserContext();
  const { ${camel} } = use${names.pascalCase}Context();
  if (!${camel}) return null;
  if (!hasPermissionToModule({ module: Modules.${names.pascalCase}, action: Action.Delete, data: ${camel} })) return null;
  return <${names.pascalCase}ContainerInternal ${camel}={${camel}} />;
}
`;
}
