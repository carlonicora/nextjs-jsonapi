// import { toast } from "@/hooks/use-toast";

import { toast } from "sonner";

export function errorToast(params: { title?: string; error: any }) {
  toast.error(params?.title ?? "Error", {
    description: params.error instanceof Error ? params.error.message : String(params.error),
  });
}
