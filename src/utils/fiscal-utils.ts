export function parseFiscalData(fiscalDataJson?: string): Record<string, string> {
  try {
    return fiscalDataJson ? JSON.parse(fiscalDataJson) : {};
  } catch {
    return {};
  }
}
