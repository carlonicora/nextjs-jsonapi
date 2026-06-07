/**
 * Content Template
 *
 * Generates {Module}Content.tsx — the prop-driven body rendered inside the
 * container's "Details" tab. Always emitted (returns a string):
 * - Content-extending modules render the BlockNote content.
 * - Other modules render an AttributeElement layout of their fields and
 *   relationships.
 */

import { pluralize, toCamelCase } from "../../transformers/name-transformer";
import { FrontendTemplateData } from "../../types/template-data.interface";

/**
 * Generate the content display component file content
 *
 * @param data - Frontend template data
 * @returns Generated file content (always a string)
 */
export function generateContentTemplate(data: FrontendTemplateData): string {
  const { names, extendsContent } = data;
  const camel = names.camelCase;

  // Content-extending modules render their BlockNote body, prop-driven.
  if (extendsContent) {
    return `"use client";

import { ${names.pascalCase}Interface } from "@/features/${data.importTargetDir}/${names.kebabCase}/data/${names.pascalCase}Interface";
import { BlockNoteEditorContainer, Card } from "@carlonicora/nextjs-jsonapi/components";

type ${names.pascalCase}ContentProps = { ${camel}: ${names.pascalCase}Interface };

export function ${names.pascalCase}Content({ ${camel} }: ${names.pascalCase}ContentProps) {
  return (
    <Card className="flex w-full flex-col p-4">
      <BlockNoteEditorContainer id={${camel}.id} type="${camel}" initialContent={${camel}.content} />
    </Card>
  );
}
`;
  }

  // Rich-text (BlockNote) fields each render as their own labelled section.
  const richFields = data.fields.filter((f) => f.isContentField);
  const attributeElements = generateAttributeElements(data);
  const hasAttributes = attributeElements.trim().length > 0;

  // When the module has one or more BlockNote fields, render a stacked layout of
  // labelled editors (read-only display), followed by an attribute grid if any
  // plain fields remain.
  if (richFields.length > 0) {
    const richSections = richFields
      .map(
        (field) => `      <div className="flex flex-col gap-y-3">
        <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {t(\`features.${names.camelCase.toLowerCase()}.fields.${field.name}.label\`)}
        </h3>
        <Card className="flex w-full flex-col p-4">
          <BlockNoteEditorContainer id={${camel}.id} type="${camel}" initialContent={${camel}.${field.name}} />
        </Card>
      </div>`,
      )
      .join("\n");

    const attributesBlock = hasAttributes
      ? `\n      <div className="flex flex-col gap-y-3">
        <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {t(\`features.${names.camelCase.toLowerCase()}.sections.details\`)}
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
${attributeElements}
        </div>
      </div>`
      : "";

    const importLine = hasAttributes
      ? `import { AttributeElement, BlockNoteEditorContainer, Card } from "@carlonicora/nextjs-jsonapi/components";`
      : `import { BlockNoteEditorContainer, Card } from "@carlonicora/nextjs-jsonapi/components";`;

    return `"use client";

import { ${names.pascalCase}Interface } from "@/features/${data.importTargetDir}/${names.kebabCase}/data/${names.pascalCase}Interface";
${importLine}
import { useTranslations } from "next-intl";

type ${names.pascalCase}ContentProps = { ${camel}: ${names.pascalCase}Interface };

export function ${names.pascalCase}Content({ ${camel} }: ${names.pascalCase}ContentProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-y-8">
${richSections}${attributesBlock}
    </div>
  );
}
`;
  }

  // Non-content modules render an AttributeElement layout of their fields.
  return `"use client";

import { ${names.pascalCase}Interface } from "@/features/${data.importTargetDir}/${names.kebabCase}/data/${names.pascalCase}Interface";
import { AttributeElement } from "@carlonicora/nextjs-jsonapi/components";
import { useTranslations } from "next-intl";

type ${names.pascalCase}ContentProps = { ${camel}: ${names.pascalCase}Interface };

export function ${names.pascalCase}Content({ ${camel} }: ${names.pascalCase}ContentProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-y-8">
      <div className="flex flex-col gap-y-3">
        <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {t(\`features.${names.camelCase.toLowerCase()}.sections.details\`)}
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
${attributeElements}
        </div>
      </div>
    </div>
  );
}
`;
}

/**
 * Generate attribute elements for display fields and relationships.
 *
 * Ported from the (removed) details template, but accessing the entity via the
 * `camelCase` prop instead of context.
 */
function generateAttributeElements(data: FrontendTemplateData): string {
  const { names, fields, relationships } = data;
  const camel = names.camelCase;
  const elements: string[] = [];

  // Add custom fields (excluding name, tldr, abstract, content and rich-text
  // BlockNote fields, which are rendered as their own sections elsewhere)
  const displayableFields = fields.filter(
    (f) => !f.isContentField && !["name", "tldr", "abstract", "content", "id"].includes(f.name),
  );

  displayableFields.forEach((field) => {
    if (field.type === "string") {
      elements.push(`          <AttributeElement
            title={t(\`features.${names.camelCase.toLowerCase()}.fields.${field.name}.label\`)}
            value={${camel}.${field.name}}
          />`);
    } else if (field.type === "boolean") {
      elements.push(`          <AttributeElement
            title={t(\`features.${names.camelCase.toLowerCase()}.fields.${field.name}.label\`)}
            value={${camel}.${field.name} ? t(\`generic.yes\`) : t(\`generic.no\`)}
          />`);
    } else if (field.type === "number") {
      elements.push(`          <AttributeElement
            title={t(\`features.${names.camelCase.toLowerCase()}.fields.${field.name}.label\`)}
            value={${camel}.${field.name}?.toString()}
          />`);
    }
  });

  // Add relationship displays (basic - can be enhanced manually)
  relationships
    .filter((rel) => rel.variant !== "Author") // Skip author, usually shown in title
    .forEach((rel) => {
      const displayProp = rel.targetHasName ? "name" : "id";
      if (rel.single) {
        const propName = toCamelCase(rel.alias || rel.variant || rel.name);
        elements.push(`          {${camel}.${propName} && (
            <AttributeElement
              title={t(\`features.${names.camelCase.toLowerCase()}.relationships.${propName.toLowerCase()}.label\`)}
              value={${camel}.${propName}.${displayProp}}
            />
          )}`);
      } else {
        const effectiveMany = rel.alias || rel.name;
        const propName = pluralize(toCamelCase(effectiveMany));
        elements.push(`          {${camel}.${propName} && ${camel}.${propName}.length > 0 && (
            <AttributeElement
              title={t(\`entities.${pluralize(rel.name.toLowerCase())}\`, { count: 2 })}
              value={${camel}.${propName}.map((item) => item.${displayProp}).join(", ")}
            />
          )}`);
      }
    });

  return elements.join("\n");
}
