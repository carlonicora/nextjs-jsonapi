"use client";

import { PencilIcon } from "lucide-react";

import { useTranslations } from "next-intl";
import { Button, DialogTrigger } from "../../shadcnui";

type CommonEditorTriggerProps = { isEdit: boolean; edit?: string; create?: string; testId?: string };

export function CommonEditorTrigger({ isEdit, edit: _edit, create, testId }: CommonEditorTriggerProps) {
  const t = useTranslations();

  return (
    <DialogTrigger>
      {isEdit ? (
        <Button
          render={<div />}
          nativeButton={false}
          size="sm"
          variant={`ghost`}
          className="text-muted-foreground"
          data-testid={testId}
        >
          <PencilIcon />
        </Button>
      ) : (
        <Button render={<div />} nativeButton={false} size="sm" variant={`outline`} data-testid={testId}>
          {create ? create : t(`ui.buttons.create`)}
        </Button>
      )}
    </DialogTrigger>
  );
}
