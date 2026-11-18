"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { registerTableGenerator, TableContent, UseTableStructureHook } from "../../../hooks";
import { SkillEditor } from "../components/forms/SkillEditor";
import { SkillScope, SkillSwitchCell } from "../components/lists/SkillSwitchCell";
import { SkillFields } from "../data/SkillFields";
import { SkillInterface } from "../data/SkillInterface";

/**
 * Skills table (spec §8.1 / §8.2): the name opens SkillEditor for that row, the
 * rest of the row is not clickable, and skills have no page of their own.
 * Mirrors hooks/useBlogCategoryTableStructure.tsx in features/blog. Reads
 * `scope`, `refresh` and `replaceElement` from the context SkillList passes.
 */
export const useSkillTableStructure: UseTableStructureHook<SkillInterface, SkillFields> = (params) => {
  const t = useTranslations();
  const scope: SkillScope = params.context?.scope ?? "company";
  /** Administration: the picked company, passed to the editor and the switch. */
  const companyId: string | undefined = params.context?.companyId;
  const refresh: (() => Promise<void>) | undefined = params.context?.refresh;
  const replaceElement: ((skill: SkillInterface) => void) | undefined = params.context?.replaceElement;

  const tableData = useMemo(() => {
    return params.data.map((skill: SkillInterface) => {
      const entry: TableContent<SkillInterface> = { jsonApiData: skill };
      params.fields.forEach((field) => {
        entry[field] = (skill as any)[field as keyof SkillInterface];
      });
      return entry;
    });
  }, [params.data, params.fields]);

  const originLabels: Record<SkillInterface["origin"], string> = {
    global: t("skill.origin.global"),
    copy: t("skill.origin.copy"),
    company: t("skill.origin.company"),
  };

  const fieldColumnMap: Partial<Record<SkillFields, () => any>> = {
    [SkillFields.name]: () => ({
      id: SkillFields.name,
      accessorKey: SkillFields.name,
      header: t("skill.columns.name"),
      cell: ({ row }: { row: TableContent<SkillInterface> }) => {
        const skill: SkillInterface = row.original.jsonApiData;
        return (
          <SkillEditor
            scope={scope}
            companyId={companyId}
            skill={skill}
            onSuccess={refresh}
            trigger={
              <button
                type="button"
                className="text-primary text-start font-medium"
                data-testid={`skill-name-${skill.name}`}
              >
                {skill.name}
              </button>
            }
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [SkillFields.description]: () => ({
      id: SkillFields.description,
      accessorKey: SkillFields.description,
      header: t("skill.columns.description"),
      cell: ({ row }: { row: TableContent<SkillInterface> }) => (
        <span className="text-sm">{row.original.jsonApiData.description}</span>
      ),
      enableSorting: false,
      enableHiding: false,
    }),
    [SkillFields.origin]: () => ({
      id: SkillFields.origin,
      accessorKey: SkillFields.origin,
      header: t("skill.columns.origin"),
      cell: ({ row }: { row: TableContent<SkillInterface> }) => {
        const skill: SkillInterface = row.original.jsonApiData;
        return (
          <span className="text-xs" data-testid={`skill-origin-${skill.name}`}>
            {originLabels[skill.origin]}
          </span>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [SkillFields.isEnabled]: () => ({
      id: SkillFields.isEnabled,
      accessorKey: SkillFields.isEnabled,
      header: t("skill.columns.active"),
      cell: ({ row }: { row: TableContent<SkillInterface> }) => (
        <SkillSwitchCell
          skill={row.original.jsonApiData}
          scope={scope}
          companyId={companyId}
          onSaved={replaceElement}
          onChanged={refresh}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }),
  };

  const columns = useMemo(() => {
    return params.fields.map((field) => fieldColumnMap[field]?.()).filter((col) => col !== undefined) as ColumnDef<
      TableContent<SkillInterface>
    >[];
  }, [params.fields, fieldColumnMap, t, scope, companyId, refresh, replaceElement]);

  return useMemo(() => ({ data: tableData, columns: columns }), [tableData, columns]);
};

registerTableGenerator("skills", useSkillTableStructure);
