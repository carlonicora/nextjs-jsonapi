"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { RoundPageContainer } from "../../../../components";
import EntitySelector from "../../../../components/forms/EntitySelector";
import { Modules } from "../../../../core";
import { usePageUrlGenerator } from "../../../../hooks/usePageUrlGenerator";
import { useI18nRouter } from "../../../../i18n";
import { CompanyInterface } from "../../../company/data/company.interface";
import { CompanyService } from "../../../company/data/company.service";
import SkillList from "../lists/SkillList";

/** Address parameter holding the picked company. */
const COMPANY_PARAM = "company";

/**
 * Administration > Skills (copies HowToListContainer). A company picker in the
 * table toolbar chooses between the global skills (empty picker, the default)
 * and one company's skills, managed exactly as that company's Settings list.
 * The picker is the library's EntitySelector: it searches companies on the
 * server a page at a time, so it works with any number of companies. The pick
 * lives in the address as `?company=<id>`; an id that is not a company falls
 * back to the global skills.
 */
export default function SkillsAdminContainer() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const router = useI18nRouter();
  const generateUrl = usePageUrlGenerator();

  const requestedCompanyId = searchParams?.get(COMPANY_PARAM) ?? undefined;
  // undefined = still reading the company named in the address; null = none.
  const [company, setCompany] = useState<CompanyInterface | null | undefined>(requestedCompanyId ? undefined : null);
  const form = useForm<{ company?: { id: string; name: string } }>({ defaultValues: { company: undefined } });

  const goTo = (companyId?: string) =>
    router.replace(
      generateUrl({
        page: Modules.Skill,
        additionalParameters: companyId ? { [COMPANY_PARAM]: companyId } : undefined,
      }),
    );

  useEffect(() => {
    if (!requestedCompanyId) {
      setCompany(null);
      form.setValue("company", undefined);
      return;
    }
    if (company?.id === requestedCompanyId) return;
    let active = true;
    setCompany(undefined);
    CompanyService.findOne({ companyId: requestedCompanyId })
      .then((found) => {
        if (!active) return;
        setCompany(found);
        form.setValue("company", { id: found.id, name: found.name });
      })
      .catch(() => {
        // An id that is not a company falls back to the global skills, and the address follows.
        if (active) goTo(undefined);
      });
    return () => {
      active = false;
    };
  }, [requestedCompanyId]);

  const picker = (
    <div
      className="w-56 min-w-0 shrink"
      data-testid="skill-company-picker"
      role="group"
      aria-label={t("skill.admin.picker.label")}
    >
      <EntitySelector<CompanyInterface>
        id="company"
        form={form}
        module={Modules.Company}
        retriever={(params) => CompanyService.findMany({ ...params, sort: "name" })}
        noneLabel={t("skill.admin.picker.global")}
        onChange={(picked) => {
          if (picked) setCompany(picked);
          goTo(picked?.id);
        }}
      />
    </div>
  );

  return (
    <RoundPageContainer module={Modules.Skill} fullWidth>
      {company === undefined ? null : company ? (
        <SkillList
          key={company.id}
          scope="company"
          companyId={company.id}
          title={t("skill.admin.title", { company: company.name })}
          toolbar={picker}
          fullWidth
        />
      ) : (
        <SkillList key="global" scope="global" toolbar={picker} fullWidth />
      )}
    </RoundPageContainer>
  );
}
