"use client";

import { useTranslations } from "next-intl";
import { DialogDescription, DialogHeader, DialogTitle } from "../../shadcnui";

type CommonEditorHeaderProps = {
  type: string;
  name?: string;
};

export function CommonEditorHeader({ type, name }: CommonEditorHeaderProps) {
  const t = useTranslations();

  return (
    <DialogHeader>
      <DialogTitle>
        {name
          ? t(`generic.edit.update.title`, {
              type: type,
            })
          : t(`generic.edit.create.title`, { type: type })}
      </DialogTitle>
      <DialogDescription>
        {name
          ? t(`generic.edit.update.description`, {
              type: type,
              name: name,
            })
          : t(`generic.edit.create.description`, {
              type: type,
            })}
      </DialogDescription>
    </DialogHeader>
  );
}
