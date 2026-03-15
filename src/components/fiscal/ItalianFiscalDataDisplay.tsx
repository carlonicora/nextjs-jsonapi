"use client";

import { AttributeElement } from "../contents";
import { useTranslations } from "next-intl";

type ItalianFiscalDataDisplayProps = {
  data: Record<string, string>;
};

export function ItalianFiscalDataDisplay({ data }: ItalianFiscalDataDisplayProps) {
  const t = useTranslations();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {data.codice_fiscale && (
        <AttributeElement title={t("common.fields.codice_fiscale.label")} value={data.codice_fiscale} />
      )}
      {data.partita_iva && <AttributeElement title={t("common.fields.partita_iva.label")} value={data.partita_iva} />}
      {data.sdi && <AttributeElement title={t("common.fields.sdi.label")} value={data.sdi} />}
      {data.rea && <AttributeElement title={t("common.fields.rea.label")} value={data.rea} />}
      {data.pec && <AttributeElement title={t("common.fields.pec.label")} value={data.pec} />}
    </div>
  );
}
