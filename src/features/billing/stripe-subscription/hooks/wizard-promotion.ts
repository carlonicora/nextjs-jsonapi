import { PromotionCodeValidationResult } from "../../stripe-promotion-code/data/stripe-promotion-code.interface";

/**
 * The promotion code the wizard sends to the API: the one the review shows,
 * typed or automatic. Sending the automatic code too lets the server refuse
 * the payment when that code is no longer valid, instead of charging a price
 * the GM was not shown.
 */
export function promotionCodeToSend(code: PromotionCodeValidationResult | null): string | undefined {
  if (!code) return undefined;
  return code.promotionCodeId;
}

/**
 * True when the wizard should ask for the automatic code: no code yet, or the
 * current one is automatic. A code the GM typed always wins.
 */
export function shouldLookUpAutomatic(code: PromotionCodeValidationResult | null): boolean {
  return !code || code.automatic === true;
}

function errorStatus(error: any): number | undefined {
  return error?.status ?? error?.response?.status;
}

/**
 * The `code` of an API error. The nestjs-neo4jsonapi `HttpExceptionFilter`
 * answers with a JSON:API error document, which `AbstractService.callApi`
 * attaches to the thrown error as `body`:
 * `{ message, errors: [{ status, code, title, detail, meta: { context: { code } } }] }`.
 */
function errorCode(error: any): string | undefined {
  const body = error?.body;
  const first = body?.errors?.[0];
  const code = first?.code ?? first?.meta?.context?.code ?? body?.code;
  return typeof code === "string" ? code : undefined;
}

/**
 * True when the API refused the payment because the automatic discount has no
 * places left (HTTP 410, code `discount_sold_out`). Nothing was charged.
 */
export function isDiscountSoldOut(error: any): boolean {
  return errorStatus(error) === 410 && errorCode(error) === "discount_sold_out";
}

/**
 * True when the API refused the payment because the automatic code the review
 * showed is no longer valid (HTTP 422, code `discount_unavailable`). Nothing was
 * charged.
 */
export function isDiscountUnavailable(error: any): boolean {
  return errorStatus(error) === 422 && errorCode(error) === "discount_unavailable";
}
