import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "../../shadcnui";

type CommonEditorButtonsProps = {
  isEdit: boolean;
  form: any;
  disabled?: boolean;
  setOpen: (open: boolean) => void;
  hideSubmit?: boolean;
  centerButtons?: ReactNode;
  buttonTitle?: string;
};
export function CommonEditorButtons({
  isEdit,
  form,
  disabled,
  setOpen,
  hideSubmit,
  centerButtons,
  buttonTitle,
}: CommonEditorButtonsProps) {
  const t = useTranslations();

  if (centerButtons) {
    return (
      <div className="flex w-full items-center justify-between gap-x-2">
        <Button variant={"outline"} type={`button`} onClick={() => setOpen(false)} data-testid={`modal-button-cancel`}>
          {t(`ui.buttons.cancel`)}
        </Button>

        <div className="flex flex-1 justify-center gap-x-2">{centerButtons}</div>

        {!hideSubmit ? (
          <Button type="submit" disabled={form.formState.isSubmitting || disabled} data-testid={`modal-button-create`}>
            {buttonTitle ? buttonTitle : isEdit ? t(`ui.buttons.confirm_update`) : t(`ui.buttons.confirm_create`)}
          </Button>
        ) : (
          <div />
        )}
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <Button
        className="mr-2"
        variant={"outline"}
        type={`button`}
        onClick={() => setOpen(false)}
        data-testid={`modal-button-cancel`}
      >
        {t(`ui.buttons.cancel`)}
      </Button>

      {!hideSubmit && (
        <Button type="submit" disabled={form.formState.isSubmitting || disabled} data-testid={`modal-button-create`}>
          {buttonTitle ? buttonTitle : isEdit ? t(`ui.buttons.confirm_update`) : t(`ui.buttons.confirm_create`)}
        </Button>
      )}
    </div>
  );
}
