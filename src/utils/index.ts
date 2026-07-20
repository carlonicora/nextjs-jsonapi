export type { ClassValue } from "clsx";
export { cn } from "./cn";
export { composeRefs, useComposedRefs } from "./compose-refs";
export { useIsMobile, MOBILE_BREAKPOINT, VIEWPORT_COOKIE_NAME } from "./use-mobile";

// New utilities
export { formatDate, formatLocalDate, type FormatOption } from "./date-formatter";
export { exists } from "./exists";
export { getTableComponents, getTableOptions, TableOptions } from "./table-options";

// Schemas
export { entityObjectSchema, userObjectSchema, type EntityObject, type UserObject } from "./schemas";

export { getInitials } from "./getInitials";
export {
  validatePartitaIva,
  validateCodiceFiscale,
  validateItalianTaxCode,
  formatPartitaIva,
  formatCodiceFiscale,
  type CodiceFiscaleValidationOptions,
} from "./italian-validators";
export * from "./blocknote-diff.util";
export * from "./blocknote-word-diff-renderer.util";
export * from "./icons";

// Toast utilities
export { showToast, showError, dismissToast, showCustomToast, type ToastOptions } from "./toast";
