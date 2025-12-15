/**
 * Details Template
 *
 * Generates {Module}Details.tsx component for displaying item details.
 */

import { FrontendTemplateData } from "../../types/template-data.interface";
import { toCamelCase, pluralize } from "../../transformers/name-transformer";

/**
 * Generate the details component file content
 *
 * @param data - Frontend template data
 * @returns Generated file content
 */
export function generateDetailsTemplate(data: FrontendTemplateData): string {
  const { names, fields, relationships, extendsContent } = data;

  const attributeElements = generateAttributeElements(data);

  return `"use client";

import { use${names.pascalCase}Context } from "@/features/${data.targetDir}/${names.kebabCase}/contexts/${names.pascalCase}Context";
import { AttributeElement, ContentTitle, ReactMarkdownContainer } from "@carlonicora/nextjs-jsonapi/components";
import { useSharedContext } from "@carlonicora/nextjs-jsonapi/contexts";
import { useTranslations } from "next-intl";

function ${names.pascalCase}DetailsInternal() {
  const { ${names.camelCase}, reload${names.pascalCase} } = use${names.pascalCase}Context();
  const t = useTranslations();
  const { title } = useSharedContext();

  if (!${names.camelCase}) return null;

  return (
    <div className="flex w-full flex-col gap-y-2">
      <ContentTitle type={title.type} element={title.element} functions={title.functions} />
${attributeElements}
    </div>
  );
}

export default function ${names.pascalCase}Details() {
  const { ${names.camelCase} } = use${names.pascalCase}Context();
  if (!${names.camelCase}) return null;

  return <${names.pascalCase}DetailsInternal />;
}
`;
}

/**
 * Generate attribute elements for display fields
 */
function generateAttributeElements(data: FrontendTemplateData): string {
  const { names, fields, relationships, extendsContent } = data;
  const elements: string[] = [];

  // Show abstract if Content-extending
  if (extendsContent) {
    elements.push(`      <AttributeElement
        title={t(\`generic.abstract\`)}
        value={<ReactMarkdownContainer size="small" content={${names.camelCase}.abstract} />}
      />`);
  }

  // Add custom fields (excluding name, tldr, abstract, content which are handled elsewhere)
  const displayableFields = fields.filter(
    (f) => !["name", "tldr", "abstract", "content", "id"].includes(f.name)
  );

  displayableFields.forEach((field) => {
    if (field.type === "string") {
      elements.push(`      <AttributeElement
        title={t(\`features.${names.camelCase}.fields.${field.name}.label\`)}
        value={${names.camelCase}.${field.name}}
      />`);
    } else if (field.type === "boolean") {
      elements.push(`      <AttributeElement
        title={t(\`features.${names.camelCase}.fields.${field.name}.label\`)}
        value={${names.camelCase}.${field.name} ? t(\`generic.yes\`) : t(\`generic.no\`)}
      />`);
    } else if (field.type === "number") {
      elements.push(`      <AttributeElement
        title={t(\`features.${names.camelCase}.fields.${field.name}.label\`)}
        value={${names.camelCase}.${field.name}?.toString()}
      />`);
    }
  });

  // Add relationship displays (basic - can be enhanced manually)
  relationships
    .filter((rel) => rel.variant !== "Author") // Skip author, usually shown in title
    .forEach((rel) => {
      if (rel.single) {
        const propName = toCamelCase(rel.variant || rel.name);
        elements.push(`      {${names.camelCase}.${propName} && (
        <AttributeElement
          title={t(\`generic.relationships.${propName}.label\`)}
          value={${names.camelCase}.${propName}.name}
        />
      )}`);
      } else {
        const propName = pluralize(toCamelCase(rel.name));
        elements.push(`      {${names.camelCase}.${propName} && ${names.camelCase}.${propName}.length > 0 && (
        <AttributeElement
          title={t(\`types.${pluralize(rel.name.toLowerCase())}\`, { count: 2 })}
          value={${names.camelCase}.${propName}.map((item) => item.name).join(", ")}
        />
      )}`);
      }
    });

  return elements.join("\n");
}
