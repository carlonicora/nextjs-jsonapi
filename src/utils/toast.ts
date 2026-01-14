import { toast as sonnerToast, type ExternalToast } from "sonner";
import type { ReactElement, JSXElementConstructor, ReactNode } from "react";

export type ToastOptions = {
  description?: ReactNode;
  duration?: number;
  id?: string;
  onDismiss?: () => void;
  action?: ExternalToast["action"];
  dismissible?: boolean;
};

/** Standard toast - neutral/white */
export function showToast(message: string, options?: ToastOptions) {
  return sonnerToast(message, options as ExternalToast);
}

/** Error toast - destructive red */
export function showError(message: string, options?: ToastOptions) {
  return sonnerToast.error(message, options as ExternalToast);
}

/** Dismiss toast(s) */
export function dismissToast(toastId?: string | number) {
  return sonnerToast.dismiss(toastId);
}

/** Custom toast - ONLY for complex UI like upload progress */
export function showCustomToast(
  render: (id: string | number) => ReactElement<unknown, string | JSXElementConstructor<unknown>>,
  options?: {
    id?: string | number;
    duration?: number;
    dismissible?: boolean;
    onDismiss?: () => void;
  },
) {
  return sonnerToast.custom(render, options);
}
