"use client";

import { PencilIcon, PlusCircleIcon } from "lucide-react";

import { useTranslations } from "next-intl";
import React from "react";
import { Button, DialogTrigger } from "../../shadcnui";

type CommonEditorTriggerProps = { isEdit: boolean; edit?: string; create?: string; testId?: string; title?: string };

export function CommonEditorTrigger({ isEdit, edit: _edit, create, testId, title }: CommonEditorTriggerProps) {
  const t = useTranslations();

  return (
    <DialogTrigger>
      {title ? (
        <Button render={<div />} nativeButton={false} size="sm" variant={`outline`} data-testid={testId}>
          {title}
        </Button>
      ) : isEdit ? (
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

export const CommonAddTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof Button>>(
  (props, ref) => (
    <Button ref={ref} variant="ghost" size="sm" className="text-muted-foreground" {...props}>
      <PlusCircleIcon />
    </Button>
  ),
);
CommonAddTrigger.displayName = "CommonAddTrigger";
