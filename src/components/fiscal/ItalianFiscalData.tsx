"use client";

import { validateItalianTaxCode, validatePartitaIva } from "../../utils/italian-validators";
import { Field, FieldError, FieldLabel, Input } from "../../shadcnui";
import { useTranslations } from "next-intl";
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { z } from "zod";

export interface FiscalDataHandle {
  validate: () => boolean;
  getData: () => Record<string, string>;
  isDirty: () => boolean;
  reset: (initialData: Record<string, string>) => void;
}

export interface ItalianFiscalDataProps {
  initialData: Record<string, string>;
}

const ItalianFiscalData = forwardRef<FiscalDataHandle, ItalianFiscalDataProps>(
  function ItalianFiscalData({ initialData }, ref) {
    const t = useTranslations();
    const initialRef = useRef<Record<string, string>>(initialData);
    const [fiscalData, setFiscalData] = useState<Record<string, string>>(initialData);
    const fiscalDataRef = useRef<Record<string, string>>(initialData);
    const [fiscalErrors, setFiscalErrors] = useState<Record<string, string>>({});

    const updateFiscalField = useCallback((key: string, value: string) => {
      setFiscalData((prev) => {
        const next = { ...prev, [key]: value };
        fiscalDataRef.current = next;
        return next;
      });
      setFiscalErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, []);

    useImperativeHandle(ref, () => ({
      validate: (): boolean => {
        const data = fiscalDataRef.current;
        const errors: Record<string, string> = {};

        if (data.codice_fiscale && !validateItalianTaxCode(data.codice_fiscale, "codiceFiscale")) {
          errors.codice_fiscale = t("common.fields.codice_fiscale.error");
        }
        if (data.partita_iva && !validatePartitaIva(data.partita_iva)) {
          errors.partita_iva = t("common.fields.partita_iva.error");
        }
        if (data.pec && !z.string().email().safeParse(data.pec).success) {
          errors.pec = t("common.fields.pec.error");
        }

        setFiscalErrors(errors);
        return Object.keys(errors).length === 0;
      },
      getData: (): Record<string, string> => fiscalDataRef.current,
      isDirty: (): boolean => JSON.stringify(fiscalDataRef.current) !== JSON.stringify(initialRef.current),
      reset: (newInitialData: Record<string, string>) => {
        initialRef.current = newInitialData;
        fiscalDataRef.current = newInitialData;
        setFiscalData(newInitialData);
        setFiscalErrors({});
      },
    }));

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field data-invalid={!!fiscalErrors.codice_fiscale}>
          <FieldLabel>{t("common.fields.codice_fiscale.label")}</FieldLabel>
          <Input
            value={fiscalData.codice_fiscale || ""}
            onChange={(e) => updateFiscalField("codice_fiscale", e.target.value)}
            placeholder={t("common.fields.codice_fiscale.placeholder")}
          />
          {fiscalErrors.codice_fiscale && <FieldError>{fiscalErrors.codice_fiscale}</FieldError>}
        </Field>
        <Field data-invalid={!!fiscalErrors.partita_iva}>
          <FieldLabel>{t("common.fields.partita_iva.label")}</FieldLabel>
          <Input
            value={fiscalData.partita_iva || ""}
            onChange={(e) => updateFiscalField("partita_iva", e.target.value)}
            placeholder={t("common.fields.partita_iva.placeholder")}
          />
          {fiscalErrors.partita_iva && <FieldError>{fiscalErrors.partita_iva}</FieldError>}
        </Field>
        <Field>
          <FieldLabel>{t("common.fields.sdi.label")}</FieldLabel>
          <Input
            value={fiscalData.sdi || ""}
            onChange={(e) => updateFiscalField("sdi", e.target.value)}
            placeholder={t("common.fields.sdi.placeholder")}
          />
        </Field>
        <Field>
          <FieldLabel>{t("common.fields.rea.label")}</FieldLabel>
          <Input
            value={fiscalData.rea || ""}
            onChange={(e) => updateFiscalField("rea", e.target.value)}
            placeholder={t("common.fields.rea.placeholder")}
          />
        </Field>
        <Field data-invalid={!!fiscalErrors.pec}>
          <FieldLabel>{t("common.fields.pec.label")}</FieldLabel>
          <Input
            value={fiscalData.pec || ""}
            onChange={(e) => updateFiscalField("pec", e.target.value)}
            placeholder={t("common.fields.pec.placeholder")}
          />
          {fiscalErrors.pec && <FieldError>{fiscalErrors.pec}</FieldError>}
        </Field>
      </div>
    );
  },
);

export default ItalianFiscalData;
