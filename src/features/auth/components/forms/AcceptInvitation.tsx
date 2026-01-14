"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { showToast } from "../../../../utils/toast";
import { z } from "zod";
import { errorToast, FormPassword } from "../../../../components";
import { Button, CardContent, CardDescription, CardHeader, CardTitle, Form } from "../../../../shadcnui";
import { useAuthContext } from "../../contexts";
import { AuthService } from "../../data/auth.service";
import { AuthComponent } from "../../enums";

export function AcceptInvitation() {
  const { setComponentType, params, setParams } = useAuthContext();
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const t = useTranslations();

  useEffect(() => {
    async function validateCode(code: string) {
      try {
        const payload: any = {
          code: code,
        };

        await AuthService.validateCode(payload);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        errorToast({ title: t(`common.errors.error`), error: e });
      }
    }

    if (params && params.code) {
      validateCode(params.code);
    } else {
      setError(t(`auth.errors.invalid_invitation_code`));
    }
  }, []);

  const formSchema = z
    .object({
      password: z.string().min(1, {
        message: t(`user.fields.password.error`),
      }),
      passwordRetype: z.string().min(1, {
        message: t("auth.errors.password_retype_required"),
      }),
    })
    .refine((data) => data.password === data.passwordRetype, {
      message: t("auth.fields.retype_password.error_not_match"),
      path: ["passwordRetype"],
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      passwordRetype: "",
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!params?.code) return;

      const payload = {
        code: params?.code,
        password: values.password,
      };

      await AuthService.acceptInvitation(payload);
      setShowConfirmation(true);

      showToast(t("auth.account_activated"), {
        description: t("auth.account_activated_description"),
      });

      setTimeout(() => {
        setComponentType(AuthComponent.Login);
        setParams(undefined);
      }, 2000);
    } catch (e) {
      errorToast({ title: t(`common.errors.error`), error });
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle className="text-primary flex flex-col items-center pb-10 text-4xl">
          <Image src="/logo.webp" alt="Logo" width={100} height={100} priority />
          {t("auth.accept_invitation")}
        </CardTitle>
        <CardDescription className="text-center text-sm">
          {error ? <>{t("auth.errors.activating_account")}</> : <>{t("auth.select_password")}</>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showConfirmation ? (
          <CardDescription className="text-center text-xl">{t("auth.activation_description")}</CardDescription>
        ) : error ? (
          <CardDescription className="text-center text-xl">{error}</CardDescription>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FormPassword
                form={form}
                id="password"
                name={t(`user.fields.password.label`)}
                placeholder={t(`user.fields.password.placeholder`)}
              />
              <FormPassword
                form={form}
                id="passwordRetype"
                name={t("auth.fields.retype_password.label")}
                placeholder={t(`auth.fields.retype_password.placeholder`)}
              />
              <Button className="mt-4 w-full" type={"submit"}>
                {t("auth.accept_invitation")}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </>
  );
}
