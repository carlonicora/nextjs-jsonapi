"use client";

import { MapPinIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { AttributeElement } from "../../../../components";
import { FiscalDataDisplay } from "../../../../components/fiscal/FiscalDataDisplay";
import { CompanyInterface } from "../../data";

type CompanyContentProps = {
  company: CompanyInterface;
};

function hasAddressDetails(company: CompanyInterface): boolean {
  return !!(
    company.street ||
    company.street_number ||
    company.city ||
    company.province ||
    company.region ||
    company.postcode ||
    company.country
  );
}

export function CompanyContent({ company }: CompanyContentProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-y-8">
      {/* Legal Address */}
      {company.legal_address && (
        <div className="text-muted-foreground flex items-center gap-x-2 text-sm">
          <MapPinIcon className="h-4 w-4 shrink-0" />
          {company.legal_address}
        </div>
      )}

      {/* Fiscal Data Section */}
      {company.fiscal_data && (
        <div className="flex flex-col gap-y-3">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            {t("company.sections.fiscal_data")}
          </h3>
          <FiscalDataDisplay fiscalData={company.fiscal_data} />
        </div>
      )}

      {/* Address Details Section */}
      {hasAddressDetails(company) && (
        <div className="flex flex-col gap-y-3">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            {t("company.sections.address_details")}
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {company.street && (
              <AttributeElement title={t("company.fields.street.label")} value={company.street} />
            )}
            {company.street_number && (
              <AttributeElement title={t("company.fields.street_number.label")} value={company.street_number} />
            )}
            {company.city && (
              <AttributeElement title={t("company.fields.city.label")} value={company.city} />
            )}
            {company.province && (
              <AttributeElement title={t("company.fields.province.label")} value={company.province} />
            )}
            {company.region && (
              <AttributeElement title={t("company.fields.region.label")} value={company.region} />
            )}
            {company.postcode && (
              <AttributeElement title={t("company.fields.postcode.label")} value={company.postcode} />
            )}
            {company.country && (
              <AttributeElement title={t("company.fields.country.label")} value={company.country} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
