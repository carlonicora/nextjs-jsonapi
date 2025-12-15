"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { v4 } from "uuid";
import { z } from "zod";
import { errorToast, FormInput, FormPassword } from "../../../../components";
import {
  Button,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Form,
  Link,
} from "../../../../shadcnui";
import { useAuthContext } from "../../contexts";
import { AuthService } from "../../data";
import { AuthComponent } from "../../enums";

export default function Register() {
  const t = useTranslations();
  const { setComponentType } = useAuthContext();

  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);

  const formSchema = z.object({
    company: z.string().min(1, {
      message: t(`generic.errors.missing_company_name`),
    }),
    name: z.string().min(1, {
      message: t("generic.errors.missing_name"),
    }),
    email: z.string().email({
      message: t(`generic.errors.invalid_email`),
    }),
    password: z
      .string()
      .min(8, t(`foundations.auth.errors.password_too_short`))
      .regex(/^(?=.*[0-9])(?=.*[^a-zA-Z0-9]).*$/, {
        message: t(`foundations.auth.errors.password_invalid_format`),
      }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company: "",
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (values: z.infer<typeof formSchema>) => {
    try {
      const payload = {
        id: v4(),
        companyName: values.company,
        name: values.name,
        email: values.email,
        password: values.password,
      };

      await AuthService.register(payload);
      setShowConfirmation(true);
    } catch (e) {
      errorToast({ error: e });
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle className="text-primary flex flex-col items-center pb-10 text-4xl">
          <Image src="/logo.webp" alt="Logo" width={100} height={100} priority />
          {t(`foundations.auth.register`)}
        </CardTitle>
        <CardDescription className="text-sm">
          {showConfirmation ? <> </> : <>{t(`foundations.auth.register_description`)}</>}
        </CardDescription>
      </CardHeader>
      {showConfirmation ? (
        <CardContent>
          <CardDescription className="text-center text-xl">
            {t("foundations.auth.register_confirmation")}
          </CardDescription>
        </CardContent>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
              <FormInput
                isRequired
                form={form}
                id="company"
                name={t(`foundations.company.fields.name.label`)}
                placeholder={t(`foundations.company.fields.name.placeholder`)}
              />
              <FormInput
                isRequired
                form={form}
                id="name"
                name={t(`foundations.user.fields.name.label`)}
                placeholder={t(`foundations.user.fields.name.placeholder`)}
              />
              <FormInput
                isRequired
                form={form}
                id="email"
                name={t(`generic.fields.email.label`)}
                placeholder={t(`generic.fields.email.placeholder`)}
              />
              <FormPassword
                isRequired
                form={form}
                id="password"
                name={t(`foundations.user.fields.password.label`)}
                placeholder={t(`foundations.user.fields.password.placeholder`)}
              />
              <Button className="mt-4 w-full" type={"submit"}>
                {t(`foundations.auth.buttons.register`)}
              </Button>
            </CardContent>
            <CardFooter className="flex w-full flex-row justify-between">
              <Link
                href="#"
                className="flex w-full justify-start"
                onClick={() => setComponentType(AuthComponent.Login)}
              >
                {t(`foundations.auth.buttons.login`)}
              </Link>
              <Link
                href="#"
                className="flex w-full justify-end"
                onClick={() => setComponentType(AuthComponent.ForgotPassword)}
              >
                {t(`foundations.auth.buttons.forgot_password`)}
              </Link>
            </CardFooter>
          </form>
        </Form>
      )}
    </>
  );
}
