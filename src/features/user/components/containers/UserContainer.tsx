"use client";

import { useTranslations } from "next-intl";
import { useUserContext } from "../../contexts";
import { UserDetails } from "../details";

export function UserContainer() {
  const { user } = useUserContext();
  if (!user) return null;

  const t = useTranslations();

  return (
    <div className="flex w-full gap-x-4">
      <div className="w-2xl flex h-[calc(100vh-theme(spacing.20))] flex-col justify-between border-r pr-4">
        <div className="flex h-full overflow-y-auto">
          <UserDetails user={user} />
        </div>
      </div>
      <div className="flex w-full flex-col gap-y-4"></div>
    </div>
  );
}
