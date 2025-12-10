"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Button, CardDescription, CardFooter, CardHeader, CardTitle, Link } from "../../../../shadcnui";
import { useAuthContext } from "../../contexts";
import { AuthComponent } from "../../enums";

export function LandingComponent() {
  const t = useTranslations();

  const { setComponentType } = useAuthContext();

  return (
    <>
      <CardHeader className="mb-4" data-testid="page-pre-login-container">
        <CardTitle className="text-primary flex flex-col items-center gap-y-8 pb-8 text-4xl">
          <Image src="/phlow-logo.webp" alt="Phlow" width={100} height={100} priority />
          {t(`generic.title`)}
        </CardTitle>
        <CardDescription className="flex w-full justify-center text-center text-sm">
          {t(`generic.description`)}
        </CardDescription>
      </CardHeader>
      <CardFooter className="mt-4 flex w-full flex-col justify-between">
        <Link href="#" className="flex w-full justify-start" onClick={() => setComponentType(AuthComponent.Register)}>
          <Button className="mt-4 w-full" variant={`default`}>
            {t(`foundations.auth.buttons.register`)}
          </Button>
        </Link>
        <Link href="#" className="flex w-full justify-end" onClick={() => setComponentType(AuthComponent.Login)}>
          <Button className="mt-4 w-full" variant={`outline`} data-testid="page-login-button-initial-login">
            {t(`foundations.auth.buttons.login`)}
          </Button>
        </Link>
      </CardFooter>
    </>
  );
}
