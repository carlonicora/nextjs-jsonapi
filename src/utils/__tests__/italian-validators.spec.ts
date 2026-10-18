import { describe, expect, it } from "vitest";

import { validateCodiceFiscale, validateItalianTaxCode, validatePartitaIva } from "../italian-validators";

const VALID_CODICE_FISCALE = "RSSMRA85M01H501Q";
const VALID_PARTITA_IVA = "00743110157";

describe("validatePartitaIva", () => {
  it("accepts a valid partita iva", () => {
    expect(validatePartitaIva(VALID_PARTITA_IVA)).toBe(true);
  });

  it("rejects a partita iva with a wrong check digit", () => {
    expect(validatePartitaIva("00743110158")).toBe(false);
  });

  it("rejects a codice fiscale", () => {
    expect(validatePartitaIva(VALID_CODICE_FISCALE)).toBe(false);
  });
});

describe("validateCodiceFiscale", () => {
  it("accepts a valid codice fiscale", () => {
    expect(validateCodiceFiscale(VALID_CODICE_FISCALE)).toBe(true);
  });

  it("rejects a partita iva by default", () => {
    expect(validateCodiceFiscale(VALID_PARTITA_IVA)).toBe(false);
  });

  it("accepts a partita iva when allowPartitaIva is set", () => {
    expect(validateCodiceFiscale(VALID_PARTITA_IVA, { allowPartitaIva: true })).toBe(true);
  });

  it("still accepts a codice fiscale when allowPartitaIva is set", () => {
    expect(validateCodiceFiscale(VALID_CODICE_FISCALE, { allowPartitaIva: true })).toBe(true);
  });

  it("rejects a value that is neither, even when allowPartitaIva is set", () => {
    expect(validateCodiceFiscale("NOT-A-CODE", { allowPartitaIva: true })).toBe(false);
    expect(validateCodiceFiscale("00743110158", { allowPartitaIva: true })).toBe(false);
  });

  it("ignores whitespace", () => {
    expect(validateCodiceFiscale("0074 3110 157", { allowPartitaIva: true })).toBe(true);
  });

  it("rejects empty values", () => {
    expect(validateCodiceFiscale("", { allowPartitaIva: true })).toBe(false);
  });
});

describe("validateItalianTaxCode", () => {
  it("forwards the options to the codice fiscale validator", () => {
    expect(validateItalianTaxCode(VALID_PARTITA_IVA, "codiceFiscale")).toBe(false);
    expect(validateItalianTaxCode(VALID_PARTITA_IVA, "codiceFiscale", { allowPartitaIva: true })).toBe(true);
  });

  it("leaves partita iva validation unchanged", () => {
    expect(validateItalianTaxCode(VALID_PARTITA_IVA, "partitaIva")).toBe(true);
    expect(validateItalianTaxCode(VALID_CODICE_FISCALE, "partitaIva")).toBe(false);
  });
});
