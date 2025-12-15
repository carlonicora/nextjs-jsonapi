"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { errorToast, FormInput, FormPassword } from "../../../../components";
import { useI18nRouter, usePageUrlGenerator } from "../../../../hooks";
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
import { UserInterface } from "../../../user";
import { useCurrentUserContext } from "../../../user/contexts";
import { useAuthContext } from "../../contexts";
import { AuthService } from "../../data";
import { AuthComponent } from "../../enums";

export function Login() {
  const t = useTranslations();
  const { setUser } = useCurrentUserContext<UserInterface>();
  const { setComponentType } = useAuthContext();
  const generateUrl = usePageUrlGenerator();
  const router = useI18nRouter();

  const formSchema = z.object({
    email: z.string().email({
      message: t(`generic.errors.invalid_email`),
    }),
    password: z.string().min(3, { message: t(`foundations.auth.errors.password_too_short`) }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (values: z.infer<typeof formSchema>) => {
    try {
      const user: UserInterface = (await AuthService.login({
        email: values.email,
        password: values.password,
      })) as UserInterface;

      setUser(user);
      router.replace(generateUrl({ page: `/` }));
    } catch (e) {
      errorToast({
        title: t(`generic.errors.error`),
        error: e,
      });
    }
  };

  return (
    <>
      <CardHeader data-testid="page-login-container">
        <CardTitle className="text-primary flex flex-col items-center pb-10 text-4xl">
          <Image src="/logo.webp" alt="Logo" width={100} height={100} priority />
          {t("foundations.auth.login")}
        </CardTitle>

        <CardDescription className="text-sm">{t(`foundations.auth.login_description`)}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <FormInput
              autoFocus
              form={form}
              id="email"
              name={t(`generic.fields.email.label`)}
              placeholder={t(`generic.fields.email.placeholder`)}
              testId="form-login-input-email"
            />
            <FormPassword
              form={form}
              id="password"
              name={t(`foundations.user.fields.password.label`)}
              placeholder={t(`foundations.user.fields.password.placeholder`)}
              testId="form-login-input-password"
            />
            <Button className="mt-4 w-full" type={"submit"} data-testid="form-login-button-submit">
              {t(`foundations.auth.login`)}
            </Button>
          </CardContent>
          <CardFooter className="flex w-full flex-row justify-between">
            <Link
              href="#"
              className="flex w-full justify-start"
              onClick={() => setComponentType(AuthComponent.Register)}
            >
              {t(`foundations.auth.register`)}
            </Link>
            <Link
              href="#"
              className="flex w-full justify-end"
              onClick={() => setComponentType(AuthComponent.ForgotPassword)}
              data-testid="form-login-link-forgot-password"
            >
              {t(`foundations.auth.forgot_password`)}
            </Link>
          </CardFooter>
        </form>
      </Form>
    </>
  );
}
