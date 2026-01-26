"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { v4 } from "uuid";
import { z } from "zod";
import { errorToast, FormInput, GdprConsentCheckbox } from "../../../../components";
import { Button, Form, Link } from "../../../../shadcnui";
import { getWaitlistConfig } from "../../config/waitlist.config";
import { WaitlistService } from "../../data/WaitlistService";
import { WaitlistQuestionnaireRenderer } from "./WaitlistQuestionnaireRenderer";

interface WaitlistFormProps {
  onSuccess?: () => void;
}

export function WaitlistForm({ onSuccess }: WaitlistFormProps) {
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const config = getWaitlistConfig();
  const questionnaireFields = config.questionnaire ?? [];

  // Build dynamic questionnaire schema based on config
  const questionnaireSchema = questionnaireFields.reduce(
    (acc, field) => {
      if (field.type === "checkbox" && field.options && field.options.length > 0) {
        // Multiple checkboxes - each option is a boolean
        const optionsSchema = field.options.reduce(
          (optAcc, opt) => {
            optAcc[opt.value] = z.boolean().optional();
            return optAcc;
          },
          {} as Record<string, z.ZodOptional<z.ZodBoolean>>,
        );
        acc[field.id] = z.object(optionsSchema).optional();
      } else if (field.type === "checkbox") {
        // Single checkbox
        acc[field.id] = field.required ? z.literal(true) : z.boolean().optional();
      } else if (field.type === "select") {
        acc[field.id] = field.required ? z.string().min(1) : z.string().optional();
      } else {
        // text, textarea
        acc[field.id] = field.required ? z.string().min(1) : z.string().optional();
      }
      return acc;
    },
    {} as Record<string, z.ZodTypeAny>,
  );

  const formSchema = z.object({
    id: z.uuidv4(),
    email: z.email({ message: t("common.errors.invalid_email") }),
    gdprConsent: z.literal(true, {
      message: t("auth.gdpr.terms_required"),
    }),
    marketingConsent: z.boolean().optional(),
    questionnaire: z.object(questionnaireSchema).optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  // Build default values for questionnaire fields
  const questionnaireDefaults = questionnaireFields.reduce(
    (acc, field) => {
      if (field.type === "checkbox" && field.options && field.options.length > 0) {
        acc[field.id] = field.options.reduce(
          (optAcc, opt) => {
            optAcc[opt.value] = false;
            return optAcc;
          },
          {} as Record<string, boolean>,
        );
      } else if (field.type === "checkbox") {
        acc[field.id] = false;
      } else {
        acc[field.id] = "";
      }
      return acc;
    },
    {} as Record<string, any>,
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: v4(),
      email: "",
      gdprConsent: false as unknown as true,
      marketingConsent: false,
      questionnaire: questionnaireDefaults,
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();

      await WaitlistService.submit({
        id: values.id,
        email: values.email,
        gdprConsent: values.gdprConsent,
        gdprConsentAt: now,
        marketingConsent: values.marketingConsent ?? false,
        marketingConsentAt: values.marketingConsent ? now : undefined,
        questionnaire: values.questionnaire,
      });

      setIsSuccess(true);
      onSuccess?.();
    } catch (e) {
      errorToast({ error: e });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{t("waitlist.success.title")}</h3>
          <p className="text-muted-foreground">{t("waitlist.success.description")}</p>
        </div>
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <Mail className="h-4 w-4" />
          <span>{t("waitlist.success.hint")}</span>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormInput
          isRequired
          form={form}
          id="email"
          name={t("common.fields.email.label")}
          placeholder={t("common.fields.email.placeholder")}
        />

        {questionnaireFields.length > 0 && <WaitlistQuestionnaireRenderer form={form} fields={questionnaireFields} />}

        <div className="space-y-4 py-4">
          <GdprConsentCheckbox
            form={form}
            id="gdprConsent"
            label={
              <>
                {t("auth.gdpr.terms_prefix")}
                <Link href="/terms" target="_blank" rel="noopener" className="underline">
                  {t("auth.gdpr.terms_of_service")}
                </Link>
                {t("auth.gdpr.and")}
                <Link href="/privacy" target="_blank" rel="noopener" className="underline">
                  {t("auth.gdpr.privacy_policy")}
                </Link>
              </>
            }
            required
          />
          <GdprConsentCheckbox
            form={form}
            id="marketingConsent"
            label={t("auth.gdpr.marketing_consent")}
            description={t("auth.gdpr.marketing_description")}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("common.actions.submitting") : t("waitlist.buttons.join")}
        </Button>
      </form>
    </Form>
  );
}
