"use client";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCurrentUserContext } from "../../user/contexts/CurrentUserContext";
import { Button } from "../../../shadcnui";
import { useHelp } from "../contexts/HelpContext";

export function HelpHeader() {
  const t = useTranslations();
  const { currentUser } = useCurrentUserContext();
  const { brand } = useHelp();
  const logo = brand?.logo;
  const label = brand?.label ?? "Help";
  const appHref = brand?.appHref ?? "/";

  return (
    <header className="border-border bg-background flex items-center justify-between border-b px-4 py-3">
      <Link href="/help" className="flex items-center gap-2">
        {logo ? <Image src={logo} alt={label} width={28} height={28} /> : null}
        <span className="text-base font-semibold">
          {label} · {t("help.footerLink")}
        </span>
      </Link>
      <div>
        {currentUser ? (
          <Button render={<Link href={appHref} />} nativeButton={false} variant="outline" size="sm">
            {t("help.header.openApp")}
          </Button>
        ) : (
          <Button render={<Link href="/login" />} nativeButton={false} variant="outline" size="sm">
            {t("help.header.login")}
          </Button>
        )}
      </div>
    </header>
  );
}
