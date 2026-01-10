"use client";

import { LoaderCircleIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { useI18nRouter, useI18nTranslations } from "../../i18n";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from "../../shadcnui";
import { errorToast } from "../errors";

type CommonDeleterProps = {
  type: string;
  deleteFunction: () => Promise<void>;
  redirectTo?: string;
  forceShow?: boolean;
};

export function CommonDeleter({ deleteFunction, redirectTo, type, forceShow }: CommonDeleterProps) {
  const t = useI18nTranslations();
  const router = useI18nRouter();
  const [open, setOpen] = useState<boolean>(forceShow || false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteFunction();

      setOpen(false);
      if (redirectTo) router.push(redirectTo);
    } catch (error) {
      errorToast({ title: t(`common.errors.delete`), error: error });
    }
    setIsDeleting(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {forceShow ? null : (
        <AlertDialogTrigger>
          <Button
            render={<div />}
            nativeButton={false}
            size="sm"
            variant={"ghost"}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2Icon />
          </Button>
        </AlertDialogTrigger>
      )}
      <AlertDialogContent className={`flex max-h-[70vh] max-w-3xl flex-col overflow-y-auto`}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t(`common.delete.title`, { type: t(`entities.${type}`, { count: 1 }) })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t(`common.delete.subtitle`, { type: t(`entities.${type}`, { count: 1 }) })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="text-destructive p-4 text-sm">
          {t(`common.delete.description`, { type: t(`entities.${type}`, { count: 1 }) })}
        </div>
        <div className="flex justify-end">
          <Button
            className="mr-2"
            variant={"outline"}
            type={`button`}
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            {t(`ui.buttons.cancel`)}
          </Button>
          <Button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            variant={"destructive"}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                {t(`ui.buttons.is_deleting`)}
                <LoaderCircleIcon className="animate-spin-slow h-5 w-5" />
              </>
            ) : (
              t(`ui.buttons.delete`)
            )}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
