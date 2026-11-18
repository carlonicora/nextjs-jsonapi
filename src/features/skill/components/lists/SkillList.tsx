"use client";

import { useTranslations } from "next-intl";
import { ReactNode } from "react";
import { ContentListTable } from "../../../../components/tables/ContentListTable";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../hooks";
import { Button } from "../../../../shadcnui/ui/button";
import { EmptyState } from "../../../../shadcnui/ui/empty-state";
import { SkillFields } from "../../data/SkillFields";
import { SkillInterface } from "../../data/SkillInterface";
import { SkillService } from "../../data/SkillService";
import "../../hooks/useSkillTableStructure";
import { SkillEditor } from "../forms/SkillEditor";
import { SkillScope } from "./SkillSwitchCell";

/**
 * The skills list: the company's skills with their state (`scope="company"`,
 * Settings) or every global skill (`scope="global"`, Administration). The On
 * switch saves in place; a name opens the editor.
 *
 * `companyId` (Administration, company scope) sends every call to the
 * Administrator's routes on that company: the list, editor, switch, restore
 * and delete behave exactly as that company's Settings list.
 */
export default function SkillList({
  scope,
  companyId,
  fullWidth,
  title,
  toolbar,
}: {
  scope: SkillScope;
  companyId?: string;
  fullWidth?: boolean;
  /** Replaces the default "Skills" table title. */
  title?: string;
  /** Extra controls shown before New skill in the table toolbar. */
  toolbar?: ReactNode;
}) {
  const t = useTranslations();
  const targetCompanyId = scope === "company" ? companyId : undefined;

  const data: DataListRetriever<SkillInterface> = useDataListRetriever({
    module: Modules.Skill,
    retriever: (params) =>
      scope === "global"
        ? SkillService.findGlobal(params)
        : SkillService.findMany(targetCompanyId ? { ...params, companyId: targetCompanyId } : params),
    retrieverParams: {},
  });

  const fields =
    scope === "global"
      ? [SkillFields.name, SkillFields.description, SkillFields.isEnabled]
      : [SkillFields.name, SkillFields.description, SkillFields.origin, SkillFields.isEnabled];

  return (
    <ContentListTable
      data={data}
      fields={fields}
      tableGeneratorType={Modules.Skill}
      functions={[
        ...(toolbar ? [<div key="skill-toolbar">{toolbar}</div>] : []),
        <SkillEditor
          key="create-skill"
          scope={scope}
          companyId={targetCompanyId}
          onSuccess={data.refresh}
          trigger={
            <Button type="button" size="sm" variant="outline" data-testid="skill-new-button">
              {t("skill.buttons.new")}
            </Button>
          }
        />,
      ]}
      title={title ?? t("entities.skills", { count: 2 })}
      fullWidth={fullWidth}
      emptyState={
        scope === "global" ? (
          <EmptyState title={t("skill.empty.global")} />
        ) : (
          <EmptyState title={t("skill.empty.title")} description={t("skill.empty.body")} />
        )
      }
      context={{ scope, companyId: targetCompanyId, refresh: data.refresh, replaceElement: data.setRefreshedElement }}
    />
  );
}
