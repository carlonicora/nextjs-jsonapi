"use client";

import { PencilIcon } from "lucide-react";

import { useTranslations } from "next-intl";
import { Button, DialogTrigger } from "../../shadcnui";

type CommonEditorTriggerProps = { isEdit: boolean; edit?: string; create?: string };

export function CommonEditorTrigger({ isEdit, edit, create }: CommonEditorTriggerProps) {
  const t = useTranslations();

  return (
    <DialogTrigger asChild>
      {isEdit ? (
        <Button size="sm" variant={`ghost`} className="text-muted-foreground">
          <PencilIcon />
        </Button>
      ) : (
        <Button size="sm" variant={`outline`}>
          {create ? create : t(`generic.buttons.create`)}
        </Button>
      )}
    </DialogTrigger>
  );
}
