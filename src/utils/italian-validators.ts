import CodiceFiscale from "codice-fiscale-js";

export function validatePartitaIva(partitaIva: string): boolean {
  if (!partitaIva || typeof partitaIva !== "string") {
    return false;
  }

  const cleaned = partitaIva.replace(/\s/g, "");

  if (!/^\d{11}$/.test(cleaned)) {
    return false;
  }

  const digits = cleaned.split("").map(Number);

  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8] + digits[10];

  let evenSum = 0;
  for (let i = 1; i < 10; i += 2) {
    let doubled = digits[i] * 2;
    if (doubled > 9) {
      doubled -= 9;
    }
    evenSum += doubled;
  }

  const totalSum = oddSum + evenSum;

  return totalSum % 10 === 0;
}

export function validateCodiceFiscale(codiceFiscale: string): boolean {
  if (!codiceFiscale || typeof codiceFiscale !== "string") {
    return false;
  }

  const cleaned = codiceFiscale.replace(/\s/g, "").toUpperCase();

  try {
    return CodiceFiscale.check(cleaned);
  } catch (error) {
    return false;
  }
}

export function validateItalianTaxCode(value: string, type: "partitaIva" | "codiceFiscale"): boolean {
  if (!value || typeof value !== "string") {
    return false;
  }

  switch (type) {
    case "partitaIva":
      return validatePartitaIva(value);
    case "codiceFiscale":
      return validateCodiceFiscale(value);
    default:
      return false;
  }
}

export function formatPartitaIva(partitaIva: string): string {
  if (!partitaIva) return "";

  const cleaned = partitaIva.replace(/\s/g, "");
  if (/^\d{11}$/.test(cleaned)) {
    return `${cleaned.substring(0, 7)} ${cleaned.substring(7, 10)} ${cleaned.substring(10)}`;
  }
  return partitaIva;
}

export function formatCodiceFiscale(codiceFiscale: string): string {
  if (!codiceFiscale) return "";

  const cleaned = codiceFiscale.replace(/\s/g, "").toUpperCase();
  if (/^[A-Z0-9]{16}$/.test(cleaned)) {
    return `${cleaned.substring(0, 6)} ${cleaned.substring(6, 11)} ${cleaned.substring(11, 15)} ${cleaned.substring(15)}`;
  }
  return codiceFiscale;
}
