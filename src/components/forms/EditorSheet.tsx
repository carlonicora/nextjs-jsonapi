"use client";

import { useTranslations } from "next-intl";
import { ReactNode, useCallback, useEffect } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { PencilIcon } from "lucide-react";
import { ModuleWithPermissions } from "../../permissions/types";
import { usePageUrlGenerator } from "../../hooks/usePageUrlGenerator";
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../shadcnui";
import { Form } from "../../shadcnui/ui/form";
import { CommonEditorButtons } from "./CommonEditorButtons";
import { CommonEditorDiscardDialog } from "./CommonEditorDiscardDialog";
import { useEditorDialog } from "./useEditorDialog";
import { errorToast } from "../errors/errorToast";

type EditorSheetSize = "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<EditorSheetSize, string> = {
  sm: "data-[side=right]:sm:max-w-2xl",
  md: "data-[side=right]:sm:max-w-3xl",
  lg: "data-[side=right]:sm:max-w-5xl",
  xl: "data-[side=right]:sm:max-w-7xl",
};

export type EditorSheetProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  onSubmit: (values: T) => Promise<{ id: string } | void>;
  onReset: () => T;
  isFormDirty?: () => boolean;

  entityType: string;
  entityName?: string;

  isEdit: boolean;
  module: ModuleWithPermissions;
  propagateChanges?: (entity: any) => void;
  onSuccess?: () => void | Promise<void>;
  onRevalidate?: (url: string) => void;
  onNavigate?: (url: string) => void;

  size?: EditorSheetSize;
  disabled?: boolean;

  trigger?: ReactNode;
  forceShow?: boolean;
  onClose?: () => void;
  dialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;

  children: ReactNode;
};

export function EditorSheet<T extends FieldValues>({
  form,
  onSubmit,
  onReset,
  isFormDirty: isFormDirtyProp,
  entityType,
  entityName,
  isEdit,
  module,
  propagateChanges,
  onSuccess,
  onRevalidate,
  onNavigate,
  size = "xl",
  disabled,
  trigger,
  forceShow,
  onClose,
  dialogOpen,
  onDialogOpenChange,
  children,
}: EditorSheetProps<T>) {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();

  const defaultIsFormDirty = useCallback(() => {
    return Object.keys(form.formState.dirtyFields).length > 0;
  }, [form.formState.dirtyFields]);

  const { open, setOpen, handleOpenChange, discardDialogProps } = useEditorDialog(
    isFormDirtyProp ?? defaultIsFormDirty,
    { dialogOpen, onDialogOpenChange, forceShow },
  );

  useEffect(() => {
    if (!open) {
      form.reset(onReset());
      onClose?.();
    }
  }, [open]);

  const wrappedOnSubmit = useCallback(
    async (values: T) => {
      try {
        const result = await onSubmit(values);
        setOpen(false);
        if (onSuccess) {
          await onSuccess();
        } else if (result) {
          onRevalidate?.(generateUrl({ page: module, id: result.id, language: "[locale]" }));
          if (isEdit && propagateChanges) {
            propagateChanges(result);
          } else {
            onNavigate?.(generateUrl({ page: module, id: result.id }));
          }
        }
      } catch (error) {
        errorToast({
          title: isEdit ? t("generic.errors.update") : t("generic.errors.create"),
          error,
        });
      }
    },
    [onSubmit, setOpen, onSuccess, onRevalidate, onNavigate, generateUrl, module, isEdit, propagateChanges, t],
  );

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        {dialogOpen === undefined &&
          (trigger ? (
            <SheetTrigger>{trigger}</SheetTrigger>
          ) : (
            <SheetTrigger>
              {isEdit ? (
                <Button
                  render={<div />}
                  nativeButton={false}
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground"
                >
                  <PencilIcon />
                </Button>
              ) : (
                <Button render={<div />} nativeButton={false} size="sm" variant="outline">
                  {t("ui.buttons.create")}
                </Button>
              )}
            </SheetTrigger>
          ))}
        <SheetContent side="right" className={sizeClasses[size]}>
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>
              {isEdit
                ? t("common.edit.update.title", { type: entityType })
                : t("common.edit.create.title", { type: entityType })}
            </SheetTitle>
            <SheetDescription>
              {isEdit
                ? t("common.edit.update.description", { type: entityType, name: entityName ?? "" })
                : t("common.edit.create.description", { type: entityType })}
            </SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(wrappedOnSubmit)} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
              <SheetFooter className="shrink-0 border-t px-6 py-4">
                <CommonEditorButtons form={form} setOpen={handleOpenChange} isEdit={isEdit} disabled={disabled} />
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
      <CommonEditorDiscardDialog {...discardDialogProps} />
    </>
  );
}
