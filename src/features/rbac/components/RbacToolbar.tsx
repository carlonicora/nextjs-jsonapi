"use client";

import { DownloadIcon, RotateCcwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge, Button } from "../../../shadcnui";

interface RbacToolbarProps {
  isDirty: boolean;
  onGenerate: () => void;
  onReset: () => void;
}

export default function RbacToolbar({ isDirty, onGenerate, onReset }: RbacToolbarProps) {
  const t = useTranslations();

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">{t("rbac.title")}</h2>
        {isDirty && (
          <Badge variant="outline" className="border-amber-400 text-amber-600">
            {t("rbac.unsaved_changes")}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onReset} disabled={!isDirty} className="gap-1">
          <RotateCcwIcon className="h-3.5 w-3.5" />
          {t("rbac.reset")}
        </Button>
        <Button size="sm" onClick={onGenerate} disabled={!isDirty} className="gap-1">
          <DownloadIcon className="h-3.5 w-3.5" />
          {t("rbac.generate_migration")}
        </Button>
      </div>
    </div>
  );
}

export { RbacToolbar };
