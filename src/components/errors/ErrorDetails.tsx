"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../shadcnui";

export function ErrorDetails({ title, message, code }: { title?: string; message: string; code: number }) {
  const t = useTranslations();

  if (code === 403)
    return (
      <div className="w-xl max-w-xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-foreground flex flex-col items-center gap-y-4 pb-10 text-4xl">
              <Image src="/logo.webp" alt="Logo" width={100} height={100} priority />
              {/* <div>{code}</div> */}
              <div>{t("common.errors.unauthorised")}</div>
            </CardTitle>
            <CardDescription className="text-center text-lg">
              {t("common.errors.unauthorised_description")}
            </CardDescription>
          </CardHeader>
          <CardContent></CardContent>
        </Card>
      </div>
    );

  return (
    <div className="w-xl max-w-xl">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-foreground flex flex-col items-center gap-y-4 pb-10 text-center text-4xl">
            <Image src="/logo.webp" alt="Logo" width={100} height={100} priority />
            <div>{code}</div>
            <div>{title}</div>
          </CardTitle>
          <CardDescription className="text-center text-lg">{message}</CardDescription>
        </CardHeader>
        <CardContent></CardContent>
      </Card>
    </div>
  );
}
