"use client";

import { useTranslations } from "next-intl";
import { isValidElement, ReactElement, ReactNode, useCallback, useEffect, useRef } from "react";
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

/**
 * Resolve the `nativeButton` contract for a caller-supplied `trigger`.
 *
 * Base UI checks `nativeButton` against the element the trigger ACTUALLY puts in
 * the DOM and logs an error when the two disagree — in BOTH directions (see
 * `@base-ui/react/internals/use-button/useButton`: "expected a native <button>"
 * / "expected a non-<button>"). Since `trigger` is supplied by the call site and
 * this package has two live conventions, no constant is correct for all of them:
 *
 *   - `<Button render={<div />} nativeButton={false}>` — the pointer-cursor
 *     convention documented in this package's CLAUDE.md — renders a `<div>`.
 *   - a plain `<Button>` / `<button>` / `<Button render={<Link />}>` renders a
 *     native `<button>` / a native `<button>` / an `<a>` respectively.
 *
 * So derive it from the element instead of hardcoding it.
 */
function resolveTriggerIsNativeButton(trigger: ReactNode): boolean {
  if (!isValidElement(trigger)) return true;

  const props = (trigger.props ?? {}) as { nativeButton?: boolean; render?: unknown };

  // The call site already declared the contract for its own element — honour it.
  if (typeof props.nativeButton === "boolean") return props.nativeButton;

  // `render={<X />}` means X is what reaches the DOM (e.g. <Link> → <a>, <div>).
  if (isValidElement(props.render)) return props.render.type === "button";

  // Intrinsic tags: only <button> is native. Components (this package's <Button>
  // and the Base UI primitives) default to rendering a native <button>.
  if (typeof trigger.type === "string") return trigger.type === "button";
  return true;
}

/**
 * The sheet opens on the inline end (`side="end"`), which SheetContent resolves
 * to the physical `right` in LTR and `left` in RTL — and its own width classes
 * are keyed to that resolved physical side. Each size therefore has to be
 * declared for BOTH sides, or an RTL sheet would fall back to SheetContent's
 * base `data-[side=left]:sm:max-w-sm`.
 */
// rtl-ok: keyed to the resolved physical side, not to a writing direction
const sizeClasses: Record<EditorSheetSize, string> = {
  sm: "data-[side=right]:sm:max-w-2xl data-[side=left]:sm:max-w-2xl",
  md: "data-[side=right]:sm:max-w-3xl data-[side=left]:sm:max-w-3xl",
  lg: "data-[side=right]:sm:max-w-5xl data-[side=left]:sm:max-w-5xl",
  xl: "data-[side=right]:sm:max-w-7xl data-[side=left]:sm:max-w-7xl",
  "2xl": "data-[side=right]:sm:!max-w-[min(96rem,90vw)] data-[side=left]:sm:!max-w-[min(96rem,90vw)]",
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

  /** Rendered on the inline-end side of the header, next to the title/description
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
  // Fingerprint of the values the form was last seeded with, used to detect that
  // the entity behind `onReset` has changed while the sheet was closed.
  const seeded = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (open) {
      hasBeenOpen.current = true;

      // Re-seed from current props when reopening an edit form. The close branch
      // below runs during `wrappedOnSubmit`, BEFORE `onSuccess` has refetched the
      // parent, so it necessarily captures pre-save values; without this the form
      // stays stale until the component remounts, and a field the user cleared
      // reappears on reopen.
      //
      // Two deliberate limits:
      //  - Only when `isEdit`. Create-mode defaults typically contain a freshly
      //    generated uuid, so they would never compare equal and every open would
      //    reset — clobbering parents that pre-fill via `form.setValue`.
      //  - Only when the values actually differ. Reseeding unconditionally would
      //    equally clobber effect-driven pre-fills on edit forms.
      if (!isEdit) return;
      const next = onReset();
      const fingerprint = JSON.stringify(next);
      if (seeded.current !== undefined && seeded.current !== fingerprint) form.reset(next);
      seeded.current = fingerprint;
    } else if (hasBeenOpen.current) {
      const next = onReset();
      form.reset(next);
      if (isEdit) seeded.current = JSON.stringify(next);
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
          // When `propagateChanges` is provided the parent handles the result
          // inline (e.g. a nested create dialog injecting the new entity back
          // into an outer form). Call it for BOTH create and edit and skip
          // navigation — otherwise a create would `router.push` away and unmount
          // the parent editor. Only navigate when no inline handler is given.
          if (propagateChanges) {
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
            //
            // `nativeButton` must match the element the trigger actually renders,
            // or Base UI logs a semantics/accessibility error at runtime. Call
            // sites pass BOTH kinds — a native `<Button>` and the div-rendering
            // `<Button render={<div />} nativeButton={false}>` convention — so it
            // is resolved per trigger rather than hardcoded (a constant `false`
            // warned on every native-button trigger).
            <SheetTrigger nativeButton={resolveTriggerIsNativeButton(trigger)} render={trigger as ReactElement} />
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
        <SheetContent side="end" className={sizeClasses[size]}>
          <SheetHeader className="border-b px-6 py-4">
            {actions ? (
              // pe-10 clears the SheetContent close button, which sits at the
              // inline end of the sheet (absolute top-4 end-4).
              <div className="flex items-start justify-between gap-x-4 pe-10">
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
