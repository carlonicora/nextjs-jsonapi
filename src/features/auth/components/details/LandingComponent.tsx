"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Button, CardDescription, CardFooter, CardHeader, CardTitle, Link } from "../../../../shadcnui";
import { getApiUrl } from "../../../../unified";
import { useAuthContext } from "../../contexts";
import { AuthComponent } from "../../enums";

export function LandingComponent() {
  const t = useTranslations();

  const { setComponentType } = useAuthContext();

  return (
    <>
      <CardHeader className="mb-4" data-testid="page-pre-login-container">
        <CardTitle className="text-primary flex flex-col items-center gap-y-8 pb-8 text-4xl">
          <Image src="/logo.webp" alt="Logo" width={100} height={100} priority />
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

        <Button
          onClick={(e) => {
            e.preventDefault();
            window.location.href = `${getApiUrl()}auth/discord`;
          }}
          className={`flex w-full justify-end`}
        >
          {/* <Image
            className="flex h-4 w-5 items-center justify-center"
            src={discordIcon}
            alt="discordIcon"
            width={20}
            height={16}
            style={{ width: "20px", height: "16px" }}
          /> */}
          <div className="text-sm font-medium leading-normal">Discord</div>
        </Button>
      </CardFooter>
    </>
  );
}
