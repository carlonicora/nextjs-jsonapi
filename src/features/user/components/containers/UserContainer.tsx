"use client";

import { RoundPageContainer, Tab } from "@/components";
import { Modules } from "@/core";
import { useTranslations } from "next-intl";
import { useUserContext } from "../../contexts";
import { UserContent } from "../details";

export function UserContainer() {
  const t = useTranslations();
  const { user } = useUserContext();
  if (!user) return null;

  const tabs: Tab[] = [
    {
      label: t("ui.labels.details"),
      content: <UserContent user={user} />,
    },
  ];

  return <RoundPageContainer module={Modules.User} tabs={tabs} />;
}
