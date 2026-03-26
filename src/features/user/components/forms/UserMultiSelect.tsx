"use client";

import { useTranslations } from "next-intl";
import { EntityMultiSelector } from "../../../../components/forms/EntityMultiSelector";
import { Modules } from "../../../../core";
import { Avatar, AvatarFallback, AvatarImage } from "../../../../shadcnui";
import { useCurrentUserContext } from "../../contexts";
import { UserInterface } from "../../data";
import { UserService } from "../../data/user.service";

function UserAvatarIcon({ className, url, name }: { className?: string; url?: string; name?: string }) {
  return (
    <Avatar className={`${className || "h-4 w-4"}`}>
      <AvatarImage src={url} />
      <AvatarFallback>
        {name
          ? name
              .split(" ")
              .map((n: string) => n.charAt(0).toUpperCase())
              .join("")
          : "U"}
      </AvatarFallback>
    </Avatar>
  );
}

type UserMultiSelectProps = {
  id: string;
  form: any;
  currentUser?: UserInterface;
  label?: string;
  placeholder?: string;
  onChange?: (users?: UserInterface[]) => void;
  maxCount?: number;
  isRequired?: boolean;
};

export function UserMultiSelect({
  id,
  form,
  currentUser,
  label,
  placeholder,
  onChange,
  isRequired = false,
}: UserMultiSelectProps) {
  const t = useTranslations();
  const { company } = useCurrentUserContext<UserInterface>();

  return (
    <EntityMultiSelector<UserInterface>
      id={id}
      form={form}
      label={label}
      placeholder={placeholder || t("ui.search.button")}
      emptyText={t("ui.search.no_results", { type: t("entities.users", { count: 2 }) })}
      isRequired={isRequired}
      retriever={(params) => UserService.findAllUsers(params)}
      retrieverParams={{ companyId: company?.id }}
      module={Modules.User}
      getLabel={(user) => user.name}
      toFormValue={(user) => ({ id: user.id, name: user.name, avatar: user.avatar })}
      excludeId={currentUser?.id}
      onChange={onChange}
      renderOption={(user) => (
        <span className="flex items-center gap-2">
          <UserAvatarIcon url={user.avatar} name={user.name} />
          {user.name}
        </span>
      )}
    />
  );
}
