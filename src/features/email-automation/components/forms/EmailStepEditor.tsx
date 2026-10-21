"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ReactNode, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { v4 } from "uuid";
import { z } from "zod";
import { EditorSheet, FormInput, FormTextarea } from "../../../../components";
import { Modules } from "../../../../core";
import { useEmailAutomation } from "../../contexts/EmailAutomationContext";
import { EmailAutomationStepInput, EmailAutomationStepInterface } from "../../data/EmailAutomationStepInterface";
import { EmailAutomationStepService } from "../../data/EmailAutomationStepService";

/** The fixed variable set the renderer fills (spec § "Rendering"). */
const TEMPLATE_VARIABLES = ["{{name}}", "{{email}}", "{{url}}", "{{unsubscribeUrl}}", "{{unsubscribeAllUrl}}"];

export type EmailStepEditorProps = {
  step?: EmailAutomationStepInterface;
  automationId: string;
  /** Canvas position for a step created from the editor. */
  initialPosition?: { x: number; y: number };
  /** The head step's delay counts from entering the automation, not from a previous email. */
  isHead?: boolean;
  trigger?: ReactNode;
  forceShow?: boolean;
  onClose?: () => void;
  dialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
  onSuccess?: () => void | Promise<void>;
};

function EmailStepEditorInternal({
  step,
  automationId,
  initialPosition,
  isHead,
  trigger,
  forceShow,
  onClose,
  dialogOpen,
  onDialogOpenChange,
  onSuccess,
}: EmailStepEditorProps) {
  const t = useTranslations();
  const { reload } = useEmailAutomation();
  const isEdit = !!step;

  const formSchema = useMemo(
    () =>
      z.object({
        id: z.uuidv4(),
        subject: z.string().min(1, { message: t("emailAutomations.step.fields.subject.error") }),
        delayHours: z.number().int().min(0),
        body: z.string().min(1, { message: t("emailAutomations.step.fields.body.error") }),
      }),
    [t],
  );

  const getDefaultValues = useCallback(
    () => ({
      id: step?.id ?? v4(),
      subject: step?.subject ?? "",
      delayHours: step?.delayHours ?? 24,
      body: step?.body ?? "",
    }),
    [step],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  return (
    <EditorSheet
      form={form}
      entityType={t("emailAutomations.step.title")}
      entityName={step?.subject}
      title={isEdit ? t("emailAutomations.step.editTitle") : t("emailAutomations.step.title")}
      isEdit={isEdit}
      module={Modules.EmailAutomationStep}
      size="lg"
      onSubmit={async (values) => {
        const payload: EmailAutomationStepInput = {
          id: values.id,
          automationId,
          subject: values.subject,
          body: values.body,
          delayHours: values.delayHours,
          positionX: step ? step.positionX : initialPosition?.x,
          positionY: step ? step.positionY : initialPosition?.y,
        };
        return isEdit
          ? await EmailAutomationStepService.update(payload)
          : await EmailAutomationStepService.create(payload);
      }}
      // Save → reload the canvas, then whatever the caller adds.
      onSuccess={async () => {
        await reload();
        await onSuccess?.();
      }}
      onReset={getDefaultValues}
      trigger={trigger}
      forceShow={forceShow}
      onClose={onClose}
      dialogOpen={dialogOpen}
      onDialogOpenChange={onDialogOpenChange}
    >
      <div className="flex w-full flex-col gap-y-4">
        <FormInput form={form} id="subject" name={t("emailAutomations.step.fields.subject.label")} isRequired />
        <FormInput
          form={form}
          id="delayHours"
          type="number"
          name={t("emailAutomations.step.fields.delayHours.label")}
          description={
            isHead ? t("emailAutomations.canvas.hoursAfterEntering") : t("emailAutomations.canvas.hoursAfterPrevious")
          }
        />
        {/* FormTextarea has no `rows` prop; min-h-72 is the height of ~14 rows. */}
        <FormTextarea
          form={form}
          id="body"
          name={t("emailAutomations.step.fields.body.label")}
          className="min-h-72"
          isRequired
          description={
            <>
              <span className="block">
                {t("emailAutomations.step.variablesHint")}{" "}
                {TEMPLATE_VARIABLES.map((variable) => (
                  <span key={variable} className="me-2 text-foreground">
                    {variable}
                  </span>
                ))}
              </span>
              <span className="mt-1 block">{t("emailAutomations.step.unsubscribeHint")}</span>
            </>
          }
        />
      </div>
    </EditorSheet>
  );
}

export function EmailStepEditor(props: EmailStepEditorProps) {
  return <EmailStepEditorInternal {...props} />;
}

export default EmailStepEditor;
