"use client";

import { useTranslations } from "next-intl";
import { ReactElement, ReactNode, useCallback, useEffect, useRef } from "react";
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

type EditorSheetSize = "sm" | "md" | "lg" | "xl" | "2xl";

const sizeClasses: Record<EditorSheetSize, string> = {
  sm: "data-[side=right]:sm:max-w-2xl",
  md: "data-[side=right]:sm:max-w-3xl",
  lg: "data-[side=right]:sm:max-w-5xl",
  xl: "data-[side=right]:sm:max-w-7xl",
  "2xl": "data-[side=right]:sm:!max-w-[min(96rem,90vw)]",
};

export type EditorSheetProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  onSubmit: (values: T) => Promise<{ id: string } | void>;
  onReset: () => T;
  isFormDirty?: () => boolean;

  entityType: string;
  entityName?: string;
  title?: ReactNode;
  description?: ReactNode;

  isEdit: boolean;
  module: ModuleWithPermissions;
  propagateChanges?: (entity: any) => void;
  onSuccess?: () => void | Promise<void>;
  onRevalidate?: (url: string) => void;
  onNavigate?: (url: string) => void;
  onSaved?: (entity: { id: string; name?: string }, entityType: string) => void;

  size?: EditorSheetSize;
  disabled?: boolean;
  hideSubmit?: boolean;
  centerButtons?: ReactNode;

  trigger?: ReactNode;
  forceShow?: boolean;
  onClose?: () => void;
  dialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;

  /** Render a fully custom footer instead of the default CommonEditorButtons.
   *  `setOpen` is the dirty-checked open handler (shows the discard dialog);
   *  `closeWithoutConfirm` is the raw setter that bypasses the discard dialog
   *  (use after a successful submit when no confirmation is needed). */
  renderFooter?: (props: {
    form: UseFormReturn<T>;
    isEdit: boolean;
    setOpen: (open: boolean) => void;
    closeWithoutConfirm: (open: boolean) => void;
  }) => ReactNode;

  /** Rendered on the right-hand side of the header, next to the title/description
   *  block. This sits OUTSIDE the <form> element — interactive elements here must
   *  use onClick handlers, never type="submit". */
  actions?: ReactNode;

  children: ReactNode;
};

export function EditorSheet<T extends FieldValues>({
  form,
  onSubmit,
  onReset,
  isFormDirty: isFormDirtyProp,
  entityType,
  entityName,
  title: titleOverride,
  description: descriptionOverride,
  isEdit,
  module,
  propagateChanges,
  onSuccess,
  onRevalidate,
  onNavigate,
  onSaved,
  size = "xl",
  disabled,
  hideSubmit,
  centerButtons,
  trigger,
  forceShow,
  onClose,
  dialogOpen,
  onDialogOpenChange,
  renderFooter,
  actions,
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

  const hasBeenOpen = useRef(false);

  useEffect(() => {
    if (open) {
      hasBeenOpen.current = true;
    } else if (hasBeenOpen.current) {
      form.reset(onReset());
      onClose?.();
    }
  }, [open]);

  const wrappedOnSubmit = useCallback(
    async (values: T) => {
      try {
        const result = await onSubmit(values);
        setOpen(false);
        if (result && onSaved) {
          onSaved(result, entityType);
        }
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
    [onSubmit, setOpen, onSuccess, onSaved, onRevalidate, onNavigate, generateUrl, module, isEdit, propagateChanges, t],
  );

  const headerTitle =
    titleOverride ??
    (isEdit
      ? t("common.edit.update.title", { type: entityType })
      : t("common.edit.create.title", { type: entityType }));
  const headerDescription =
    descriptionOverride ??
    (isEdit
      ? t("common.edit.update.description", { type: entityType, name: entityName ?? "" })
      : t("common.edit.create.description", { type: entityType }));

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        {dialogOpen === undefined &&
          forceShow === undefined &&
          (trigger ? (
            // Base UI: the trigger renders its own <button>. Pass the caller's
            // element via `render` (NOT as children) so it BECOMES the trigger
            // button — otherwise an interactive trigger (e.g. <Button>) nests a
            // <button> inside SheetTrigger's <button> (invalid HTML / hydration
            // error). `render` also preserves the element's native `disabled`.
            <SheetTrigger render={trigger as ReactElement} />
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
            {actions ? (
              // pr-10 clears the SheetContent close button (absolute top-4 right-4).
              <div className="flex items-start justify-between gap-x-4 pr-10">
                <div className="flex min-w-0 flex-col gap-y-1.5">
                  <SheetTitle>{headerTitle}</SheetTitle>
                  <SheetDescription>{headerDescription}</SheetDescription>
                </div>
                <div className="flex shrink-0 items-center gap-x-2">{actions}</div>
              </div>
            ) : (
              <>
                <SheetTitle>{headerTitle}</SheetTitle>
                <SheetDescription>{headerDescription}</SheetDescription>
              </>
            )}
          </SheetHeader>
          <Form {...form}>
            <form
              onSubmit={(e) => {
                // The Sheet content is portaled, but React synthetic events still
                // bubble up the React tree — so without stopPropagation an inner
                // EditorSheet's submit also triggers the outer form's submit
                // (e.g. a create dialog opened from within another editor).
                e.stopPropagation();
                return form.handleSubmit(wrappedOnSubmit)(e);
              }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
              <SheetFooter className="shrink-0 border-t px-6 py-4">
                {renderFooter ? (
                  renderFooter({ form, isEdit, setOpen: handleOpenChange, closeWithoutConfirm: setOpen })
                ) : (
                  <CommonEditorButtons
                    form={form}
                    setOpen={handleOpenChange}
                    isEdit={isEdit}
                    disabled={disabled}
                    hideSubmit={hideSubmit}
                    centerButtons={centerButtons}
                  />
                )}
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
      <CommonEditorDiscardDialog {...discardDialogProps} />
    </>
  );
}
