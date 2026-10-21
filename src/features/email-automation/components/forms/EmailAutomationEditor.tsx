"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { v4 } from "uuid";
import { z } from "zod";
import { EditorSheet, FormInput, FormSelect, FormSwitch } from "../../../../components";
import { Modules } from "../../../../core";
import { useI18nRouter } from "../../../../i18n";
import { EmailAutomationInput, EmailAutomationInterface } from "../../data/EmailAutomationInterface";
import { EmailAutomationService } from "../../data/EmailAutomationService";
import { EmailAutomationTriggerInterface } from "../../data/EmailAutomationTriggerInterface";

export type EmailAutomationEditorProps = {
  automation?: EmailAutomationInterface;
  propagateChanges?: (automation: EmailAutomationInterface) => void;
  onSuccess?: () => void | Promise<void>;
  trigger?: ReactNode;
  forceShow?: boolean;
  onClose?: () => void;
  dialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
};

function EmailAutomationEditorInternal({
  automation,
  propagateChanges,
  onSuccess,
  trigger,
  forceShow,
  onClose,
  dialogOpen,
  onDialogOpenChange,
}: EmailAutomationEditorProps) {
  const t = useTranslations();
  const router = useI18nRouter();
  const isEdit = !!automation;
  const [triggers, setTriggers] = useState<EmailAutomationTriggerInterface[]>([]);

  // Trigger labels are plain strings from the app config, not i18n keys.
  useEffect(() => {
    let active = true;
    EmailAutomationService.findTriggers()
      .then((list) => {
        if (active) setTriggers(list);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const triggerValues = useMemo(() => triggers.map((entry) => ({ id: entry.key, text: entry.label })), [triggers]);

  const formSchema = useMemo(
    () =>
      z.object({
        id: z.uuidv4(),
        name: z.string().min(1, { message: t("emailAutomations.fields.name.error") }),
        trigger: z.string().optional(),
        exitTrigger: z.string().optional(),
        replyTo: z.string().refine((value) => value === "" || z.email().safeParse(value).success, {
          message: t("emailAutomations.fields.replyTo.error"),
        }),
        isActive: z.boolean(),
      }),
    [t],
  );

  const getDefaultValues = useCallback(
    () => ({
      id: automation?.id ?? v4(),
      name: automation?.name ?? "",
      trigger: automation?.trigger ?? "",
      exitTrigger: automation?.exitTrigger ?? "",
      replyTo: automation?.replyTo ?? "",
      isActive: automation?.isActive ?? false,
    }),
    [automation],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  return (
    <EditorSheet
      form={form}
      entityType={t("emailAutomations.admin.title")}
      entityName={automation?.name}
      title={isEdit ? t("emailAutomations.admin.editAutomation") : t("emailAutomations.admin.newAutomation")}
      isEdit={isEdit}
      module={Modules.EmailAutomation}
      size="md"
      propagateChanges={propagateChanges}
      onSuccess={onSuccess}
      onNavigate={(url) => router.push(url)}
      onSubmit={async (values) => {
        const payload: EmailAutomationInput = {
          id: values.id,
          name: values.name,
          trigger: values.trigger || undefined,
          exitTrigger: values.exitTrigger || undefined,
          replyTo: values.replyTo || undefined,
          isActive: values.isActive,
        };
        return isEdit ? await EmailAutomationService.update(payload) : await EmailAutomationService.create(payload);
      }}
      onReset={getDefaultValues}
      trigger={trigger}
      forceShow={forceShow}
      onClose={onClose}
      dialogOpen={dialogOpen}
      onDialogOpenChange={onDialogOpenChange}
    >
      <div className="flex w-full flex-col gap-y-4">
        <FormInput form={form} id="name" name={t("emailAutomations.fields.name.label")} isRequired />
        <FormSelect
          form={form}
          id="trigger"
          name={t("emailAutomations.fields.trigger.label")}
          placeholder={t("emailAutomations.fields.trigger.none")}
          values={triggerValues}
          allowEmpty
        />
        <FormSelect
          form={form}
          id="exitTrigger"
          name={t("emailAutomations.fields.exitTrigger.label")}
          placeholder={t("emailAutomations.fields.trigger.none")}
          values={triggerValues}
          allowEmpty
        />
        <FormInput form={form} id="replyTo" name={t("emailAutomations.fields.replyTo.label")} />
        <FormSwitch
          form={form}
          id="isActive"
          name={t("emailAutomations.fields.isActive.label")}
          description={t("emailAutomations.fields.isActive.help")}
        />
      </div>
    </EditorSheet>
  );
}

export function EmailAutomationEditor(props: EmailAutomationEditorProps) {
  return <EmailAutomationEditorInternal {...props} />;
}

export default EmailAutomationEditor;
