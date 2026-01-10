import { useTranslations } from "next-intl";
import { Button } from "../../shadcnui";

type CommonEditorButtonsProps = {
  isEdit: boolean;
  form: any;
  disabled?: boolean;
  setOpen: (open: boolean) => void;
};
export function CommonEditorButtons({ isEdit, form, disabled, setOpen }: CommonEditorButtonsProps) {
  const t = useTranslations();

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

      <Button type="submit" disabled={form.formState.isSubmitting || disabled} data-testid={`modal-button-create`}>
        {isEdit ? t(`ui.buttons.confirm_update`) : t(`ui.buttons.confirm_create`)}
      </Button>
    </div>
  );
}
