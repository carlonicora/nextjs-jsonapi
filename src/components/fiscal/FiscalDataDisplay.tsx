"use client";

import { parseFiscalData } from "../../utils/fiscal-utils";
import { ItalianFiscalDataDisplay } from "./ItalianFiscalDataDisplay";

type FiscalDataDisplayProps = {
  fiscalData: string;
  country?: string;
};

function hasNonEmptyValues(data: Record<string, string>): boolean {
  return Object.values(data).some((v) => v && v.trim() !== "");
}

export function FiscalDataDisplay({ fiscalData, country = "it" }: FiscalDataDisplayProps) {
  const data = parseFiscalData(fiscalData);

  if (!hasNonEmptyValues(data)) return null;

  switch (country) {
    case "it":
      return <ItalianFiscalDataDisplay data={data} />;
    default:
      return <ItalianFiscalDataDisplay data={data} />;
  }
}
