"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { v4 } from "uuid";
import { z } from "zod";

// Referral cookie utilities
const REFERRAL_COOKIE_NAME = "referral_code";

function getReferralCode(): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [name, value] = cookie.split("=");
    if (name === REFERRAL_COOKIE_NAME && value) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

function clearReferralCode(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${REFERRAL_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

// Helper function to build OAuth URLs with both invite and referral codes
function buildOAuthQueryParams(inviteCode?: string | null, referralCode?: string | null): string {
  const params = new URLSearchParams();
  if (inviteCode) params.set("invite", inviteCode);
  if (referralCode) params.set("referral", referralCode);
  return params.toString() ? `?${params.toString()}` : "";
}
import { getApiUrl } from "../../../../client/config";
import { errorToast, FormInput, FormPassword } from "../../../../components";
import { getRegistrationMode, isDiscordAuthEnabled, isGoogleAuthEnabled } from "../../../../login/config";
import { GdprConsentSection } from "../GdprConsentSection";
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
import { AuthService } from "../../data/auth.service";
import { AuthComponent } from "../../enums";
import { WaitlistService } from "../../../waitlist/data/WaitlistService";

export default function Register() {
  const t = useTranslations();
  const { setComponentType } = useAuthContext();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite");
  const registrationMode = getRegistrationMode();

  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [inviteValidated, setInviteValidated] = useState<boolean>(false);
  const [inviteError, setInviteError] = useState<string>("");
  // Initialize loading state to true if we have an invite code in waitlist mode
  const [isValidatingInvite, setIsValidatingInvite] = useState<boolean>(
    registrationMode === "waitlist" && !!inviteCode,
  );

  // Store referral code from cookie on mount
  const referralCodeRef = useRef<string | null>(null);
  useEffect(() => {
    referralCodeRef.current = getReferralCode();
  }, []);

  const formSchema = z.object({
    company: z.string().min(1, {
      message: t(`common.errors.missing_company_name`),
    }),
    name: z.string().min(1, {
      message: t("common.errors.missing_name"),
    }),
    email: z.string().email({
      message: t(`common.errors.invalid_email`),
    }),
    password: z
      .string()
      .min(8, t(`auth.errors.password_too_short`))
      .regex(/^(?=.*[0-9])(?=.*[^a-zA-Z0-9]).*$/, {
        message: t(`auth.errors.password_invalid_format`),
      }),
    termsAccepted: z.literal(true, {
      message: t("auth.gdpr.terms_required"),
    }),
    marketingConsent: z.boolean().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company: "",
      name: "",
      email: "",
      password: "",
      termsAccepted: false as unknown as true,
      marketingConsent: false,
    },
  });

  useEffect(() => {
    async function validateInvite() {
      if (registrationMode !== "waitlist" || !inviteCode) {
        return;
      }

      setIsValidatingInvite(true);
      try {
        const result = await WaitlistService.validateInvite(inviteCode);

        if (result && result.valid) {
          setInviteValidated(true);
          form.setValue("email", result.email);
        } else {
          const errorMsg = result ? t("waitlist.invite.error_expired") : t("waitlist.invite.error_invalid");
          setInviteError(errorMsg);
        }
      } catch (_error) {
        setInviteError(t("waitlist.invite.error_validation_failed"));
      } finally {
        setIsValidatingInvite(false);
      }
    }

    validateInvite();
  }, [registrationMode, inviteCode, form, t]);

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (values: z.infer<typeof formSchema>) => {
    try {
      const payload = {
        id: v4(),
        companyName: values.company,
        name: values.name,
        email: values.email,
        password: values.password,
        termsAcceptedAt: new Date().toISOString(),
        marketingConsent: values.marketingConsent ?? false,
        marketingConsentAt: values.marketingConsent ? new Date().toISOString() : null,
        inviteCode: inviteCode ?? undefined,
        referralCode: referralCodeRef.current ?? undefined,
      };

      await AuthService.register(payload);
      // Clear referral cookie after successful registration
      clearReferralCode();
      setShowConfirmation(true);
    } catch (e) {
      errorToast({ error: e });
    }
  };

  // Show loading state while validating invite
  if (registrationMode === "waitlist" && inviteCode && isValidatingInvite) {
    return (
      <>
        <CardHeader>
          <CardTitle className="text-primary flex flex-col items-center pb-10 text-4xl">
            <Image src="/logo.webp" alt="Logo" width={100} height={100} priority />
            {t("waitlist.invite.validating_title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t("waitlist.invite.validating_description")}</p>
        </CardContent>
      </>
    );
  }

  // Show error if invite validation failed
  if (registrationMode === "waitlist" && inviteCode && inviteError) {
    return (
      <>
        <CardHeader>
          <CardTitle className="text-primary flex flex-col items-center pb-10 text-4xl">
            <Image src="/logo.webp" alt="Logo" width={100} height={100} priority />
            {t("waitlist.invite.invalid_title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-destructive mb-4">{inviteError}</p>
          <p className="mb-4">{t("waitlist.invite.join_prompt")}</p>
          <Link href="/waitlist" className="text-primary underline">
            {t("waitlist.invite.join_link")}
          </Link>
        </CardContent>
      </>
    );
  }

  // Show waitlist message if in waitlist mode without invite
  if (registrationMode === "waitlist" && !inviteCode) {
    return (
      <>
        <CardHeader>
          <CardTitle className="text-primary flex flex-col items-center pb-10 text-4xl">
            <Image src="/logo.webp" alt="Logo" width={100} height={100} priority />
            {t("waitlist.invite.registration_title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">{t("waitlist.invite.registration_description")}</p>
          <p className="mb-4">{t("waitlist.invite.registration_hint")}</p>
          <Link href="/waitlist" className="text-primary underline">
            {t("waitlist.invite.join_link")}
          </Link>
        </CardContent>
        <CardFooter className="flex w-full flex-row justify-between">
          <Link href="#" className="flex w-full justify-start" onClick={() => setComponentType(AuthComponent.Login)}>
            {t("auth.buttons.login")}
          </Link>
        </CardFooter>
      </>
    );
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="text-primary flex flex-col items-center pb-10 text-4xl">
          <Image src="/logo.webp" alt="Logo" width={100} height={100} priority />
          {t(`auth.buttons.register`)}
        </CardTitle>
        <CardDescription className="text-sm">
          {showConfirmation ? <> </> : <>{t(`auth.register_description`)}</>}
        </CardDescription>
      </CardHeader>
      {showConfirmation ? (
        <CardContent>
          <CardDescription className="text-center text-xl">{t("auth.register_confirmation")}</CardDescription>
        </CardContent>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
              <FormInput
                isRequired
                form={form}
                id="company"
                name={t(`company.fields.name.label`)}
                placeholder={t(`company.fields.name.placeholder`)}
              />
              <FormInput
                isRequired
                form={form}
                id="name"
                name={t(`user.fields.name.label`)}
                placeholder={t(`user.fields.name.placeholder`)}
              />
              <FormInput
                isRequired
                form={form}
                id="email"
                name={t(`common.fields.email.label`)}
                placeholder={t(`common.fields.email.placeholder`)}
              />
              <FormPassword
                isRequired
                form={form}
                id="password"
                name={t(`user.fields.password.label`)}
                placeholder={t(`user.fields.password.placeholder`)}
              />
              <GdprConsentSection form={form} />
              <Button className="mt-4 w-full" type={"submit"}>
                {t(`auth.buttons.register`)}
              </Button>

              {/* OAuth options when invite code is validated */}
              {registrationMode === "waitlist" &&
                inviteValidated &&
                (isGoogleAuthEnabled() || isDiscordAuthEnabled()) && (
                  <div className="space-y-4 pt-4">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">{t("auth.buttons.or")}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {isGoogleAuthEnabled() && (
                        <Link
                          href={`${getApiUrl()}auth/google${buildOAuthQueryParams(inviteCode, referralCodeRef.current)}`}
                          className="flex w-full"
                        >
                          <Button
                            className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
                            variant="outline"
                            type="button"
                          >
                            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                              <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              />
                              <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              />
                            </svg>
                            {t("waitlist.buttons.register_with_google")}
                          </Button>
                        </Link>
                      )}
                      {isDiscordAuthEnabled() && (
                        <Link
                          href={`${getApiUrl()}auth/discord${buildOAuthQueryParams(inviteCode, referralCodeRef.current)}`}
                          className="flex w-full"
                        >
                          <Button className="w-full" variant="outline" type="button">
                            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                            </svg>
                            {t("waitlist.buttons.register_with_discord")}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
            </CardContent>
            <CardFooter className="flex w-full flex-row justify-between">
              <Link
                href="#"
                className="flex w-full justify-start"
                onClick={() => setComponentType(AuthComponent.Login)}
              >
                {t(`auth.buttons.login`)}
              </Link>
              <Link
                href="#"
                className="flex w-full justify-end"
                onClick={() => setComponentType(AuthComponent.ForgotPassword)}
              >
                {t(`auth.buttons.forgot_password`)}
              </Link>
            </CardFooter>
          </form>
        </Form>
      )}
    </>
  );
}
