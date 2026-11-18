"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  cloneElement,
  isValidElement,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { v4 } from "uuid";
import { z } from "zod";

import { errorToast } from "../../../../components/errors/errorToast";
import { CommonDeleter } from "../../../../components/forms/CommonDeleter";
import { EditorSheet } from "../../../../components/forms/EditorSheet";
import { FormInput } from "../../../../components/forms/FormInput";
import { FormSwitch } from "../../../../components/forms/FormSwitch";
import { FormTextarea } from "../../../../components/forms/FormTextarea";
import { Modules } from "../../../../core";
import { Button } from "../../../../shadcnui/ui/button";
import { ConfirmDialog } from "../../../../shadcnui/ui/confirm-dialog";
import { SkillInput, SkillInterface } from "../../data/SkillInterface";
import { SkillService } from "../../data/SkillService";
import { SkillScope, skillErrorHas, skillErrorStatus } from "../lists/SkillSwitchCell";

/** Limits of spec §5, enforced again by the server. */
const NAME_PATTERN = /^[a-z][a-z0-9-]{1,39}$/;
const DESCRIPTION_MAX = 200;
const INSTRUCTIONS_MAX = 20000;

/** The list or editor is out of date: the skill is gone (404) or its state no longer allows the action. */
function isChangedError(error: unknown): boolean {
  const status = skillErrorStatus(error);
  return status === 404 || (status === 409 && skillErrorHas(error, "changed"));
}

/** The message the editor shows under the name field for a server refusal, if any. */
function nameFieldErrorMessage(error: unknown, t: (key: string) => string, scope: SkillScope): string | undefined {
  const status = skillErrorStatus(error);
  // Administration: another global skill has the name (spec section 6, "This name is already taken.").
  if (status === 409 && skillErrorHas(error, "name_taken"))
    return scope === "global" ? t("skill.fields.name.used") : t("skill.fields.name.taken");
  if (status === 409 && skillErrorHas(error, "name_global")) return t("skill.fields.name.global");
  if (status === 422 && skillErrorHas(error, "limit_reached")) return t("skill.errors.limit");
  return undefined;
}

type SkillEditorProps = {
  scope: SkillScope;
  /** Administration: the picked company, whose routes every call goes to (company scope only). */
  companyId?: string;
  skill?: SkillInterface;
  trigger?: ReactNode;
  onSuccess?: () => void;
};

/**
 * The skill side sheet (spec §8.1 / §8.2). Opened on a list row it first reads
 * the full skill, since list rows carry no instructions. In the company scope
 * the opening decides the shape: an untouched global saves as a new copy, a
 * copy can be restored, a hidden global is read-only.
 */
export function SkillEditor({ scope, companyId, skill, trigger, onSuccess }: SkillEditorProps) {
  const t = useTranslations();
  // The picked company's routes (Administration), or the caller's own company when absent.
  const target = scope === "company" && companyId ? { companyId } : undefined;
  const companyCall = {
    findOne: (id: string) => SkillService.findOne(target ? { id, ...target } : { id }),
    create: (input: SkillInput) => (target ? SkillService.create(input, target) : SkillService.create(input)),
    update: (input: SkillInput) => (target ? SkillService.update(input, target) : SkillService.update(input)),
    delete: (id: string) => SkillService.delete(target ? { id, ...target } : { id }),
  };
  const [open, setOpen] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [loaded, setLoaded] = useState<SkillInterface | undefined>(undefined);
  const current = loaded ?? skill;

  const inCompany = scope === "company";
  const isHidden = inCompany && !!skill?.isHidden;
  const isUntouchedGlobal = inCompany && skill?.origin === "global" && !isHidden;
  const isCopy = inCompany && skill?.origin === "copy";
  const nameLocked = isHidden || isUntouchedGlobal || isCopy;
  const showActive = !(inCompany && skill?.origin === "global");
  const canDelete = !!skill && (scope === "global" || skill.origin === "company");
  const canRestore = isCopy && !!skill?.canRestore;

  const notice = isHidden
    ? t("skill.hidden")
    : isUntouchedGlobal
      ? t("skill.notice.global")
      : isCopy
        ? t("skill.notice.copy")
        : undefined;

  const formSchema = useMemo(
    () =>
      z.object({
        id: z.string(),
        name: z.string().regex(NAME_PATTERN, { message: t("skill.fields.name.error") }),
        // Kept exactly as typed (spec section 5): whitespace-only counts as empty, but the
        // value itself is never trimmed.
        description: z
          .string()
          .max(DESCRIPTION_MAX, { message: t("skill.fields.description.error") })
          .refine((value) => value.trim().length > 0, { message: t("skill.fields.description.error") }),
        instructions: z
          .string()
          .max(INSTRUCTIONS_MAX, { message: t("skill.fields.instructions.error") })
          .refine((value) => value.trim().length > 0, { message: t("skill.fields.instructions.error") }),
        isActive: z.boolean(),
      }),
    [t],
  );

  const getDefaultValues = useCallback(
    () => ({
      id: current?.id ?? v4(),
      name: current?.name ?? "",
      description: current?.description ?? "",
      instructions: current?.instructions ?? "",
      isActive: current ? current.isActive : true,
    }),
    [current],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  const close = useCallback(() => setOpen(false), []);

  const reportChanged = useCallback(
    async (error: unknown) => {
      errorToast({ title: t("skill.errors.changed"), error });
      close();
      await onSuccess?.();
    },
    [t, close, onSuccess],
  );

  // A list row has no instructions: read the full skill each time the sheet opens.
  useEffect(() => {
    if (!open || !skill) return;
    let active = true;
    const read = scope === "global" ? SkillService.findOneGlobal({ id: skill.id }) : companyCall.findOne(skill.id);
    read
      .then((full) => {
        if (active && full) setLoaded(full);
      })
      .catch((error) => {
        if (active && isChangedError(error)) void reportChanged(error);
      });
    return () => {
      active = false;
    };
  }, [open, skill, scope, companyId]);

  // The list row already filled name and description, so the user may have typed
  // before the full skill arrived: keep what they changed, fill in the rest.
  useEffect(() => {
    if (loaded) form.reset(getDefaultValues(), { keepDirtyValues: true });
  }, [loaded]);

  /** Delete and Restore: a stale skill reloads the list and closes; any other failure keeps the sheet as it is. */
  const remove = async (call: () => Promise<void>) => {
    try {
      await call();
      close();
      await onSuccess?.();
    } catch (error) {
      if (isChangedError(error)) {
        await reportChanged(error);
        return;
      }
      errorToast({ title: t("skill.errors.switch"), error });
    }
  };

  const description = form.watch("description") ?? "";
  const instructions = form.watch("instructions") ?? "";
  const name = form.watch("name");

  const actions =
    canDelete || canRestore ? (
      <>
        {canRestore && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            data-testid="skill-restore-button"
            onClick={() => setConfirmRestore(true)}
          >
            {t("skill.buttons.restore")}
          </Button>
        )}
        {canDelete && skill && (
          <CommonDeleter
            type="skills"
            testId="skill-delete-button"
            description={
              scope === "global" ? (
                <div className="text-destructive p-4 text-sm">{t("skill.delete.global")}</div>
              ) : undefined
            }
            deleteFunction={() =>
              remove(() =>
                scope === "global" ? SkillService.deleteGlobal({ id: skill.id }) : companyCall.delete(skill.id),
              )
            }
          />
        )}
      </>
    ) : undefined;

  const openTrigger = isValidElement(trigger) ? (
    cloneElement(trigger as ReactElement<{ onClick?: () => void }>, { onClick: () => setOpen(true) })
  ) : (
    <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
      {skill ? t("skill.editor.edit") : t("skill.buttons.new")}
    </Button>
  );

  return (
    <>
      {openTrigger}
      <EditorSheet
        form={form}
        entityType={t("entities.skills", { count: 1 })}
        entityName={current?.name}
        title={skill ? t("skill.editor.edit") : t("skill.editor.create")}
        description={notice ? <span data-testid="skill-editor-notice">{notice}</span> : ""}
        isEdit={!!skill}
        module={Modules.Skill}
        size="lg"
        hideSubmit={isHidden}
        actions={actions}
        onSuccess={onSuccess}
        dialogOpen={open}
        onDialogOpenChange={setOpen}
        onReset={() => getDefaultValues()}
        onSubmitError={(error) => nameFieldErrorMessage(error, t, scope) !== undefined}
        onSubmit={async (values) => {
          const input: SkillInput = {
            id: values.id,
            name: values.name,
            description: values.description,
            instructions: values.instructions,
            isActive: values.isActive,
          };
          try {
            if (scope === "global")
              return skill ? await SkillService.updateGlobal(input) : await SkillService.createGlobal(input);

            if (isUntouchedGlobal && current) {
              // Nothing changed: nothing is made.
              if (values.description === current.description && values.instructions === current.instructions) return;
              // The copy takes the original's name and switch state on the server; the
              // name is sent only because the create body requires one.
              return await companyCall.create({
                id: v4(),
                name: current.name,
                description: values.description,
                instructions: values.instructions,
                originalId: current.id,
              });
            }

            // A copy keeps its name: the field is read-only and the server keeps the stored
            // name whatever is sent, but the update body requires one, so it is sent as is.

            return skill ? await companyCall.update(input) : await companyCall.create(input);
          } catch (error) {
            // Out of date: tell the user, then let the sheet close and the list reload.
            if (isChangedError(error)) {
              errorToast({ title: t("skill.errors.changed"), error });
              return;
            }
            const message = nameFieldErrorMessage(error, t, scope);
            if (message) form.setError("name", { type: "server", message });
            throw error;
          }
        }}
      >
        <div className="flex w-full flex-col gap-y-4">
          <FormInput
            form={form}
            id="name"
            name={t("skill.fields.name.label")}
            description={t("skill.fields.name.help", { name: name || "…" })}
            disabled={nameLocked}
            testId="skill-editor-name"
            isRequired={!nameLocked}
          />
          <FormInput
            form={form}
            id="description"
            name={t("skill.fields.description.label")}
            description={`${t("skill.fields.description.help")} ${t("skill.counter", {
              count: description.length,
              max: DESCRIPTION_MAX,
            })}`}
            disabled={isHidden}
            testId="skill-editor-description"
            isRequired={!isHidden}
          />
          <FormTextarea
            form={form}
            id="instructions"
            name={t("skill.fields.instructions.label")}
            description={
              <span className="flex justify-between gap-x-4">
                <span>{t("skill.fields.instructions.help")}</span>
                <span className="tabular-nums">
                  {t("skill.counter", { count: instructions.length, max: INSTRUCTIONS_MAX })}
                </span>
              </span>
            }
            disabled={isHidden}
            testId="skill-editor-instructions"
            isRequired={!isHidden}
          />
          {showActive && (
            <div data-testid="skill-editor-active">
              <FormSwitch form={form} id="isActive" name={t("skill.fields.active.label")} />
            </div>
          )}
        </div>
      </EditorSheet>
      {canRestore && skill && (
        <ConfirmDialog
          open={confirmRestore}
          onOpenChange={setConfirmRestore}
          title={t("skill.buttons.restore")}
          description={t("skill.restore.confirm")}
          confirmLabel={t("skill.buttons.restore")}
          cancelLabel={t("ui.buttons.cancel")}
          destructive
          onConfirm={() => remove(() => companyCall.delete(skill.id))}
        />
      )}
    </>
  );
}
