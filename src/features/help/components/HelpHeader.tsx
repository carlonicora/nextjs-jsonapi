"use client";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCurrentUserContext } from "../../user/contexts/CurrentUserContext";
import { buttonVariants } from "../../../shadcnui";
import { useHelp } from "../contexts/HelpContext";
import { HelpAskAi } from "./HelpAskAi";

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
      <div className="flex items-center gap-2">
        <HelpAskAi />
        {/* Styled Links, not <Button render={<Link/>} nativeButton={false}>. Base UI's
            Button primitive warns when rendered as a non-button, and nativeButton={false}
            silences that by stamping role="button" onto the anchor — so a control that
            navigates would announce as a button. Both of these navigate, so they stay
            real links and only borrow the button styling. */}
        {currentUser ? (
          <Link href={appHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
            {t("help.header.openApp")}
          </Link>
        ) : (
          <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
            {t("help.header.login")}
          </Link>
        )}
      </div>
    </header>
  );
}
