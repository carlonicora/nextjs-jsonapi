"use client";

import { useTranslations } from "next-intl";
import { AttributeElement } from "../../../../components/contents";
import { EditableAvatar } from "../../../../components/EditableAvatar";
import { getInitials } from "../../../../utils/getInitials";
import { Modules } from "../../../../core";
import { usePageUrlGenerator } from "../../../../hooks";
import { Badge, Link } from "../../../../shadcnui";
import { RoleInterface } from "../../../role";
import { UserInterface } from "../../data";
import { UserService } from "../../data/user.service";
import { useUserContext } from "../../contexts";
import { BriefcaseIcon, MailIcon, PhoneIcon } from "lucide-react";

type UserContentProps = {
  user: UserInterface;
};

export function UserContent({ user }: UserContentProps) {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();
  const { setUser } = useUserContext();

  const hasBio = !!user.bio;

  return (
    <div className="flex flex-col gap-y-8">
      {/* Hero Section */}
      <div className="flex items-start gap-x-6">
        <EditableAvatar
          entityId={user.id}
          module={Modules.User}
          image={user.avatar}
          fallback={getInitials(user.name)}
          alt={user.name}
          patchImage={async (imageKey) => {
            const updated = await UserService.patchAvatar({ id: user.id, avatar: imageKey });
            setUser(updated);
          }}
          className="h-24 w-24"
          fallbackClassName="text-2xl"
        />
        <div className="flex flex-col gap-y-2">
          {user.roles && user.roles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role: RoleInterface) => (
                <Link key={role.id} href={generateUrl({ page: Modules.Role, id: role.id })}>
                  <Badge variant="default">{t(`role.roles`, { role: role.id.replaceAll(`-`, ``) })}</Badge>
                </Link>
              ))}
            </div>
          )}
          {user.isDeleted ? (
            <div>
              <Badge variant="destructive">{t(`user.errors.deleted`)}</Badge>
            </div>
          ) : (
            <>
              {!user.isActivated && (
                <div>
                  <Badge variant="destructive">{t(`user.errors.inactive`)}</Badge>
                </div>
              )}
            </>
          )}
          {user.title && (
            <div className="text-muted-foreground flex items-center gap-x-2 text-sm">
              <BriefcaseIcon className="h-4 w-4 shrink-0" />
              {user.title}
            </div>
          )}
          {user.email && (
            <div className="text-muted-foreground flex items-center gap-x-2 text-sm">
              <MailIcon className="h-4 w-4 shrink-0" />
              {user.email}
            </div>
          )}
          {user.phone && (
            <div className="text-muted-foreground flex items-center gap-x-2 text-sm">
              <PhoneIcon className="h-4 w-4 shrink-0" />
              {user.phone}
            </div>
          )}
        </div>
      </div>

      {/* Bio Section */}
      {hasBio && <AttributeElement title={t(`user.fields.bio.label`)} value={user.bio} />}
    </div>
  );
}
