"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ReactNode, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { v4 } from "uuid";
import { z } from "zod";
import { EditorSheet, FormInput, FormTextarea } from "../../../../components";
import { Modules } from "../../../../core";
import { useI18nRouter } from "../../../../i18n";
import { EmailBlastInput, EmailBlastInterface } from "../../data/EmailBlastInterface";
import { EmailBlastService } from "../../data/EmailBlastService";

/** The fixed variable set the blast renderer fills. */
const TEMPLATE_VARIABLES = ["{{name}}", "{{email}}", "{{url}}", "{{unsubscribeAllUrl}}"];

export type EmailBlastEditorProps = {
  blast?: EmailBlastInterface;
  propagateChanges?: (blast: EmailBlastInterface) => void;
  onSuccess?: () => void | Promise<void>;
  trigger?: ReactNode;
  forceShow?: boolean;
  onClose?: () => void;
  dialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
};

function EmailBlastEditorInternal({
  blast,
  propagateChanges,
  onSuccess,
  trigger,
  forceShow,
  onClose,
  dialogOpen,
  onDialogOpenChange,
}: EmailBlastEditorProps) {
  const t = useTranslations();
  const router = useI18nRouter();
  const isEdit = !!blast;

  const formSchema = useMemo(
    () =>
      z.object({
        id: z.uuidv4(),
        subject: z.string().min(1, { message: t("emailBlasts.editor.fields.subject.error") }),
        body: z.string().min(1, { message: t("emailBlasts.editor.fields.body.error") }),
        replyTo: z.string().refine((value) => value === "" || z.email().safeParse(value).success, {
          message: t("emailBlasts.editor.fields.replyTo.error"),
        }),
      }),
    [t],
  );

  const getDefaultValues = useCallback(
    () => ({
      id: blast?.id ?? v4(),
      subject: blast?.subject ?? "",
      body: blast?.body ?? "",
      replyTo: blast?.replyTo ?? "",
    }),
    [blast],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  return (
    <EditorSheet
      form={form}
      entityType={t("emailBlasts.editor.title")}
      entityName={blast?.subject}
      title={isEdit ? t("emailBlasts.editor.editTitle") : t("emailBlasts.editor.title")}
      isEdit={isEdit}
      module={Modules.EmailBlast}
      size="lg"
      propagateChanges={propagateChanges}
      onSuccess={onSuccess}
      onNavigate={(url) => router.push(url)}
      onSubmit={async (values) => {
        const payload: EmailBlastInput = {
          id: values.id,
          subject: values.subject,
          body: values.body,
          replyTo: values.replyTo || undefined,
        };
        return isEdit ? await EmailBlastService.update(payload) : await EmailBlastService.create(payload);
      }}
      onReset={getDefaultValues}
      trigger={trigger}
      forceShow={forceShow}
      onClose={onClose}
      dialogOpen={dialogOpen}
      onDialogOpenChange={onDialogOpenChange}
    >
      <div className="flex w-full flex-col gap-y-4">
        <FormInput form={form} id="subject" name={t("emailBlasts.editor.fields.subject.label")} isRequired />
        <FormInput form={form} id="replyTo" name={t("emailBlasts.editor.fields.replyTo.label")} />
        {/* FormTextarea has no `rows` prop; min-h-72 is the height of ~14 rows. */}
        <FormTextarea
          form={form}
          id="body"
          name={t("emailBlasts.editor.fields.body.label")}
          className="min-h-72"
          isRequired
          description={
            <>
              <span className="block">
                {t("emailBlasts.editor.variablesHint")}{" "}
                {TEMPLATE_VARIABLES.map((variable) => (
                  <span key={variable} className="me-2 text-foreground">
                    {variable}
                  </span>
                ))}
              </span>
              <span className="mt-1 block">{t("emailBlasts.editor.unsubscribeHint")}</span>
            </>
          }
        />
      </div>
    </EditorSheet>
  );
}

export function EmailBlastEditor(props: EmailBlastEditorProps) {
  return <EmailBlastEditorInternal {...props} />;
}

export default EmailBlastEditor;
