"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { getApiUrl } from "../../../../client/config";
import { errorToast, FormInput, FormPassword } from "../../../../components";
import { useI18nRouter, usePageUrlGenerator } from "../../../../hooks";
import { isDiscordAuthEnabled, isGoogleAuthEnabled, isInternalAuthEnabled } from "../../../../login";
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
import { AuthService } from "../../data/auth.service";
import { TwoFactorChallengeInterface } from "../../data/two-factor-challenge.interface";
import { AuthComponent } from "../../enums";
import { GoogleSignInButton } from "../buttons/GoogleSignInButton";

export function Login() {
  const t = useTranslations();
  const { setUser } = useCurrentUserContext<UserInterface>();
  const { setComponentType, setPendingTwoFactor } = useAuthContext();
  const generateUrl = usePageUrlGenerator();
  const i18nRouter = useI18nRouter();
  const nativeRouter = useRouter(); // For URLs that already include locale
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const formSchema = z.object({
    email: z.string().email({
      message: t(`common.errors.invalid_email`),
    }),
    password: z.string().min(3, { message: t(`auth.errors.password_too_short`) }),
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
      const response = await AuthService.login({
        email: values.email,
        password: values.password,
      });

      console.log("[Login] Received response:", {
        hasPendingToken: "pendingToken" in response,
        isUser: "id" in response,
      });

      // Check if 2FA is required (response is TwoFactorChallengeInterface)
      if ("pendingToken" in response) {
        const challenge = response as TwoFactorChallengeInterface;
        console.log("[Login] 2FA required, switching to TwoFactorChallenge component");
        setPendingTwoFactor(challenge);
        setComponentType(AuthComponent.TwoFactorChallenge);
        return;
      }

      // Normal login flow
      console.log("[Login] Normal login flow, setting user");
      const user = response as UserInterface;
      setUser(user);

      // Redirect to callback URL if present, otherwise go to home
      // Use native router for callbackUrl since it already includes the locale prefix
      // Use i18n router for normal navigation which adds locale automatically
      if (callbackUrl) {
        nativeRouter.replace(callbackUrl);
      } else {
        i18nRouter.replace(generateUrl({ page: `/` }));
      }
    } catch (e) {
      console.error("[Login] Login error:", e);
      errorToast({
        title: t(`common.errors.error`),
        error: e,
      });
    }
  };

  return (
    <>
      <CardHeader data-testid="page-login-container">
        <CardTitle className="text-primary flex flex-col items-center pb-10 text-4xl">
          <Image src="/logo.webp" alt="Logo" width={100} height={100} priority />
          {t("auth.buttons.login")}
        </CardTitle>

        <CardDescription className="text-sm">{t(`auth.login_description`)}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            {isInternalAuthEnabled() && (
              <>
                <FormInput
                  autoFocus
                  form={form}
                  id="email"
                  name={t(`common.fields.email.label`)}
                  placeholder={t(`common.fields.email.placeholder`)}
                  testId="form-login-input-email"
                />
                <FormPassword
                  form={form}
                  id="password"
                  name={t(`user.fields.password.label`)}
                  placeholder={t(`user.fields.password.placeholder`)}
                  testId="form-login-input-password"
                />
                <Button className="mt-4 w-full" type={"submit"} data-testid="form-login-button-submit">
                  {t(`auth.buttons.login`)}
                </Button>
              </>
            )}
          </CardContent>
          <CardFooter className="flex w-full flex-col gap-y-4 mt-4">
            {isGoogleAuthEnabled() && <GoogleSignInButton />}
            {isDiscordAuthEnabled() && (
              <Link href={`${getApiUrl()}auth/discord`} className="flex w-full justify-end">
                <Button className="w-full" variant={`outline`} data-testid="page-login-button-initial-login">
                  Login with Discord
                </Button>
              </Link>
            )}
            <div className="flex w-full flex-row justify-between">
              <Link
                href="#"
                className="flex w-full justify-start"
                onClick={() => setComponentType(AuthComponent.Register)}
              >
                {t(`auth.buttons.register`)}
              </Link>
              <Link
                href="#"
                className="flex w-full justify-end"
                onClick={() => setComponentType(AuthComponent.ForgotPassword)}
                data-testid="form-login-link-forgot-password"
              >
                {t(`auth.buttons.forgot_password`)}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </>
  );
}
