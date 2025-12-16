/**
 * Table Hook Template
 *
 * Generates use{Module}TableStructure.tsx for table column definitions.
 */

import { FrontendTemplateData, FrontendField } from "../types/template-data.interface";
import { toCamelCase } from "../transformers/name-transformer";

/**
 * Generate the table structure hook file content
 *
 * @param data - Frontend template data
 * @returns Generated file content
 */
export function generateTableHookTemplate(data: FrontendTemplateData): string {
  const { names, fields, extendsContent, tableFieldNames } = data;

  const fieldColumnEntries = generateFieldColumnEntries(data);
  const hasAuthors = extendsContent;
  const hasRelevance = fields.some((f) => f.name === "relevance");

  return `"use client";

import { ${names.pascalCase}Fields } from "@/features/${data.targetDir}/${names.kebabCase}/data/${names.pascalCase}Fields";
import { ${names.pascalCase}Interface } from "@/features/${data.targetDir}/${names.kebabCase}/data/${names.pascalCase}Interface";
import { cellDate, cellId${hasAuthors ? ", ContributorsList" : ""} } from "@carlonicora/nextjs-jsonapi/components";
import { Modules } from "@carlonicora/nextjs-jsonapi/core";${extendsContent ? `
import { ContentInterface } from "@carlonicora/nextjs-jsonapi/core";` : ""}
import {
  registerTableGenerator,
  TableContent,
  usePageUrlGenerator,
  UseTableStructureHook,
} from "@carlonicora/nextjs-jsonapi/client";
import { Link, Tooltip, TooltipContent, TooltipTrigger } from "@carlonicora/nextjs-jsonapi/components";
import { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

export const use${names.pascalCase}TableStructure: UseTableStructureHook<${names.pascalCase}Interface, ${names.pascalCase}Fields> = (params) => {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();

  const tableData = useMemo(() => {
    return params.data.map((${names.camelCase}: ${names.pascalCase}Interface) => {
      const entry: TableContent<${names.pascalCase}Interface> = {
        jsonApiData: ${names.camelCase},
      };
      entry[${names.pascalCase}Fields.${names.camelCase}Id] = ${names.camelCase}.id;
      params.fields.forEach((field) => {
        entry[field] = ${names.camelCase}[field as keyof ${names.pascalCase}Interface];
      });
      return entry;
    });
  }, [params.data, params.fields]);

  const fieldColumnMap: Partial<Record<${names.pascalCase}Fields, () => any>> = {
    [${names.pascalCase}Fields.${names.camelCase}Id]: () =>
      cellId({
        name: "${names.camelCase}Id",
        checkedIds: params.checkedIds,
        toggleId: params.toggleId,
      }),
${fieldColumnEntries}
    [${names.pascalCase}Fields.createdAt]: () =>
      cellDate({
        name: "createdAt",
        title: t(\`generic.date.create\`),
      }),
    [${names.pascalCase}Fields.updatedAt]: () =>
      cellDate({
        name: "updatedAt",
        title: t(\`generic.date.update\`),
      }),
  };

  const columns = useMemo(() => {
    return params.fields.map((field) => fieldColumnMap[field]?.()).filter((col) => col !== undefined) as ColumnDef<
      TableContent<${names.pascalCase}Interface>
    >[];
  }, [params.fields, fieldColumnMap, t, generateUrl]);

  return useMemo(() => ({ data: tableData, columns: columns }), [tableData, columns]);
};

registerTableGenerator(Modules.${names.pascalCase}, use${names.pascalCase}TableStructure);
`;
}

/**
 * Generate field column map entries
 */
function generateFieldColumnEntries(data: FrontendTemplateData): string {
  const { names, fields, extendsContent } = data;
  const entries: string[] = [];

  // Name field (with link and tooltip for tldr if Content-extending)
  if (fields.some((f) => f.name === "name") || extendsContent) {
    entries.push(`    [${names.pascalCase}Fields.name]: () => ({
      id: "name",
      accessorKey: "name",
      header: t(\`features.${names.camelCase}.fields.name.label\`),
      cell: ({ row }: { row: TableContent<${names.pascalCase}Interface> }) => {
        const ${names.camelCase}: ${names.pascalCase}Interface = row.original.jsonApiData;
        return (
          <Tooltip>
            <TooltipTrigger>
              <Link href={generateUrl({ page: Modules.${names.pascalCase}, id: ${names.camelCase}.id })}>{${names.camelCase}.name}</Link>
            </TooltipTrigger>${extendsContent ? `
            <TooltipContent>{${names.camelCase}.tldr}</TooltipContent>` : `
            <TooltipContent>{${names.camelCase}.name}</TooltipContent>`}
          </Tooltip>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),`);
  }

  // Authors field for Content-extending modules
  if (extendsContent) {
    entries.push(`    [${names.pascalCase}Fields.authors]: () => ({
      id: "authors",
      accessorKey: "authors",
      header: t(\`generic.relationships.author.label\`),
      cell: ({ row }: { row: TableContent<ContentInterface> }) => {
        const content: ContentInterface = row.original.jsonApiData;
        return <ContributorsList content={content} />;
      },
      enableSorting: false,
      enableHiding: false,
    }),`);
  }

  // Other displayable fields (excluding id, name, tldr, abstract, content, dates)
  const displayableFields = fields.filter(
    (f) => !["id", "name", "tldr", "abstract", "content", "createdAt", "updatedAt"].includes(f.name)
  );

  displayableFields.forEach((field) => {
    if (field.type === "string") {
      entries.push(`    [${names.pascalCase}Fields.${field.name}]: () => ({
      id: "${field.name}",
      accessorKey: "${field.name}",
      header: t(\`features.${names.camelCase}.fields.${field.name}.label\`),
      cell: ({ row }: { row: TableContent<${names.pascalCase}Interface> }) => {
        const ${names.camelCase}: ${names.pascalCase}Interface = row.original.jsonApiData;
        return <span>{${names.camelCase}.${field.name}}</span>;
      },
      enableSorting: false,
      enableHiding: false,
    }),`);
    } else if (field.type === "boolean") {
      entries.push(`    [${names.pascalCase}Fields.${field.name}]: () => ({
      id: "${field.name}",
      accessorKey: "${field.name}",
      header: t(\`features.${names.camelCase}.fields.${field.name}.label\`),
      cell: ({ row }: { row: TableContent<${names.pascalCase}Interface> }) => {
        const ${names.camelCase}: ${names.pascalCase}Interface = row.original.jsonApiData;
        return <span>{${names.camelCase}.${field.name} ? t(\`generic.yes\`) : t(\`generic.no\`)}</span>;
      },
      enableSorting: false,
      enableHiding: false,
    }),`);
    } else if (field.type === "number") {
      entries.push(`    [${names.pascalCase}Fields.${field.name}]: () => ({
      id: "${field.name}",
      accessorKey: "${field.name}",
      header: t(\`features.${names.camelCase}.fields.${field.name}.label\`),
      cell: ({ row }: { row: TableContent<${names.pascalCase}Interface> }) => {
        const ${names.camelCase}: ${names.pascalCase}Interface = row.original.jsonApiData;
        return <span>{${names.camelCase}.${field.name}?.toString()}</span>;
      },
      enableSorting: false,
      enableHiding: false,
    }),`);
    }
  });

  return entries.join("\n");
}
