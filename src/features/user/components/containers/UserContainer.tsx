"use client";

import { RoundPageContainer, Tab } from "@/components";
import { Modules } from "@/core";
import { useUserContext } from "../../contexts";
import { UserDetails } from "../details";

export function UserContainer() {
  const { user } = useUserContext();
  if (!user) return null;

  const tabs: Tab[] = [
    {
      label: "Details",
      content: <UserDetails user={user} />,
    },
  ];

  return <RoundPageContainer module={Modules.User} tabs={tabs} />;
}
