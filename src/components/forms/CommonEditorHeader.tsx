"use client";

import { useTranslations } from "next-intl";
import { DialogDescription, DialogHeader, DialogTitle } from "../../shadcnui";

type CommonEditorHeaderProps = {
  type: string;
  name?: string;
  title?: string;
  description?: string;
};

export function CommonEditorHeader({ type, name, title, description }: CommonEditorHeaderProps) {
  const t = useTranslations();

  return (
    <DialogHeader>
      <DialogTitle>
        {title
          ? title
          : name
            ? t(`common.edit.update.title`, {
                type: type,
              })
            : t(`common.edit.create.title`, { type: type })}
      </DialogTitle>
      <DialogDescription>
        {description
          ? description
          : name
            ? t(`common.edit.update.description`, {
                type: type,
                name: name,
              })
            : t(`common.edit.create.description`, {
                type: type,
              })}
      </DialogDescription>
    </DialogHeader>
  );
}
