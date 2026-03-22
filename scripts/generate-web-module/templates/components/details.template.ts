/**
 * Details / Content Template
 *
 * For content-extending modules: Generates {Module}Details.tsx (sidebar with AttributeElements).
 * For non-content modules: Generates {Module}Content.tsx (prop-driven, named export, sectioned layout).
 */

import { pluralize, toCamelCase } from "../../transformers/name-transformer";
import { FrontendTemplateData } from "../../types/template-data.interface";

/**
 * Generate the details/content component file content.
 * The generator routes this to the correct file path based on extendsContent.
 *
 * @param data - Frontend template data
 * @returns Generated file content
 */
export function generateDetailsTemplate(data: FrontendTemplateData): string {
  if (data.extendsContent) {
    return generateDetailsForContent(data);
  }
  return generateContentDisplay(data);
}

/**
 * Generate {Module}Details.tsx for content-extending modules (sidebar/AttributeElements, context-driven)
 */
function generateDetailsForContent(data: FrontendTemplateData): string {
  const { names, fields, relationships } = data;

  const attributeElements = generateAttributeElements(data);

  return `"use client";

import { use${names.pascalCase}Context } from "@/features/${data.importTargetDir}/${names.kebabCase}/contexts/${names.pascalCase}Context";
import { AttributeElement, ContentTitle, ReactMarkdownContainer } from "@carlonicora/nextjs-jsonapi/components";
import { useSharedContext } from "@carlonicora/nextjs-jsonapi/contexts";
import { Modules } from "@carlonicora/nextjs-jsonapi/core";
import { useTranslations } from "next-intl";

function ${names.pascalCase}DetailsInternal() {
  const { ${names.camelCase}, reload${names.pascalCase} } = use${names.pascalCase}Context();
  const t = useTranslations();
  const { title } = useSharedContext();

  if (!${names.camelCase}) return null;

  return (
    <div className="flex w-full flex-col gap-y-2">
      <ContentTitle type={title.type} element={title.element} functions={title.functions} module={Modules.${names.pascalCase}} />
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
 * Generate {Module}Content.tsx for non-content modules (prop-driven, named export, sectioned layout)
 */
function generateContentDisplay(data: FrontendTemplateData): string {
  const { names, fields, relationships } = data;
  const moduleLower = names.camelCase.toLowerCase();

  const fieldElements = generateContentFieldElements(data);
  const relationshipElements = generateContentRelationshipElements(data);

  return `"use client";

import { ${names.pascalCase}Interface } from "@/features/${data.importTargetDir}/${names.kebabCase}/data/${names.pascalCase}Interface";
import { AttributeElement } from "@carlonicora/nextjs-jsonapi/components";
import { useTranslations } from "next-intl";

type ${names.pascalCase}ContentProps = {
  ${names.camelCase}: ${names.pascalCase}Interface;
};

export function ${names.pascalCase}Content({ ${names.camelCase} }: ${names.pascalCase}ContentProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-y-8">
      {/* Details Section */}
      <div className="flex flex-col gap-y-3">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
${fieldElements}${relationshipElements}
        </div>
      </div>
    </div>
  );
}
`;
}

/**
 * Generate field elements for Content display
 */
function generateContentFieldElements(data: FrontendTemplateData): string {
  const { names, fields } = data;
  const moduleLower = names.camelCase.toLowerCase();
  const elements: string[] = [];

  const displayableFields = fields.filter((f) => !["name", "tldr", "abstract", "content", "id"].includes(f.name));

  displayableFields.forEach((field) => {
    if (field.type === "string") {
      elements.push(`          <AttributeElement
            title={t(\`features.${moduleLower}.fields.${field.name}.label\`)}
            value={${names.camelCase}.${field.name}}
          />`);
    } else if (field.type === "boolean") {
      elements.push(`          <AttributeElement
            title={t(\`features.${moduleLower}.fields.${field.name}.label\`)}
            value={${names.camelCase}.${field.name} ? t(\`generic.yes\`) : t(\`generic.no\`)}
          />`);
    } else if (field.type === "number") {
      elements.push(`          <AttributeElement
            title={t(\`features.${moduleLower}.fields.${field.name}.label\`)}
            value={${names.camelCase}.${field.name}?.toString()}
          />`);
    }
  });

  return elements.join("\n");
}

/**
 * Generate relationship elements for Content display
 */
function generateContentRelationshipElements(data: FrontendTemplateData): string {
  const { names, relationships } = data;
  const elements: string[] = [];

  relationships
    .filter((rel) => rel.variant !== "Author")
    .forEach((rel) => {
      const displayProp = rel.targetHasName ? "name" : "id";
      if (rel.single) {
        const propName = toCamelCase(rel.alias || rel.variant || rel.name);
        elements.push(`          {${names.camelCase}.${propName} && (
            <AttributeElement
              title={t(\`generic.relationships.${propName}.label\`)}
              value={${names.camelCase}.${propName}.${displayProp}}
            />
          )}`);
      } else {
        const effectiveMany = rel.alias || rel.name;
        const propName = pluralize(toCamelCase(effectiveMany));
        elements.push(`          {${names.camelCase}.${propName} && ${names.camelCase}.${propName}.length > 0 && (
            <AttributeElement
              title={t(\`entities.${pluralize(rel.name.toLowerCase())}\`, { count: 2 })}
              value={${names.camelCase}.${propName}.map((item) => item.${displayProp}).join(", ")}
            />
          )}`);
      }
    });

  if (elements.length === 0) return "";
  return "\n" + elements.join("\n");
}

/**
 * Generate attribute elements for content-extending Details (legacy pattern)
 */
function generateAttributeElements(data: FrontendTemplateData): string {
  const { names, fields, relationships, extendsContent } = data;
  const elements: string[] = [];

  if (extendsContent) {
    elements.push(`      <AttributeElement
        title={t(\`generic.abstract\`)}
        value={<ReactMarkdownContainer size="small" content={${names.camelCase}.abstract} />}
      />`);
  }

  const displayableFields = fields.filter((f) => !["name", "tldr", "abstract", "content", "id"].includes(f.name));

  displayableFields.forEach((field) => {
    if (field.type === "string") {
      elements.push(`      <AttributeElement
        title={t(\`features.${names.camelCase.toLowerCase()}.fields.${field.name}.label\`)}
        value={${names.camelCase}.${field.name}}
      />`);
    } else if (field.type === "boolean") {
      elements.push(`      <AttributeElement
        title={t(\`features.${names.camelCase.toLowerCase()}.fields.${field.name}.label\`)}
        value={${names.camelCase}.${field.name} ? t(\`generic.yes\`) : t(\`generic.no\`)}
      />`);
    } else if (field.type === "number") {
      elements.push(`      <AttributeElement
        title={t(\`features.${names.camelCase.toLowerCase()}.fields.${field.name}.label\`)}
        value={${names.camelCase}.${field.name}?.toString()}
      />`);
    }
  });

  relationships
    .filter((rel) => rel.variant !== "Author")
    .forEach((rel) => {
      const displayProp = rel.targetHasName ? "name" : "id";
      if (rel.single) {
        const propName = toCamelCase(rel.alias || rel.variant || rel.name);
        elements.push(`      {${names.camelCase}.${propName} && (
        <AttributeElement
          title={t(\`generic.relationships.${propName}.label\`)}
          value={${names.camelCase}.${propName}.${displayProp}}
        />
      )}`);
      } else {
        const effectiveMany = rel.alias || rel.name;
        const propName = pluralize(toCamelCase(effectiveMany));
        elements.push(`      {${names.camelCase}.${propName} && ${names.camelCase}.${propName}.length > 0 && (
        <AttributeElement
          title={t(\`entities.${pluralize(rel.name.toLowerCase())}\`, { count: 2 })}
          value={${names.camelCase}.${propName}.map((item) => item.${displayProp}).join(", ")}
        />
      )}`);
      }
    });

  return elements.join("\n");
}
