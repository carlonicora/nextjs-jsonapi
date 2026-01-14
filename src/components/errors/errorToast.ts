import { showError } from "../../utils/toast";

export function errorToast(params: { title?: string; error: any }) {
  showError(params?.title ?? "Error", {
    description: params.error instanceof Error ? params.error.message : String(params.error),
  });
}
