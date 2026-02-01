"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { ReactElement } from "react";
import { AttributeElement, ContentTitle } from "../../../../components";
import { useSharedContext } from "../../../../contexts";
import { Modules } from "../../../../core";
import { usePageUrlGenerator } from "../../../../hooks";
import { Badge, Link } from "../../../../shadcnui";
import { RoleInterface } from "../../../role";
import { UserInterface } from "../../data";

type UserDetailsProps = {
  user: UserInterface;
};

export function UserStanadaloneDetails({ user }: UserDetailsProps) {
  const generateUrl = usePageUrlGenerator();
  const t = useTranslations();
  const { title } = useSharedContext();

  let roles: ReactElement<any> = <></>;

  if (user.roles && user.roles.length > 0) {
    roles = (
      <div className="mb-4 w-full">
        <div className="flex flex-wrap gap-2">
          {user.roles.map((role: RoleInterface, _index: number) => (
            <Link key={role.id} href={generateUrl({ page: Modules.Role, id: role.id })}>
              <Badge className="mr-2" variant={`default`}>
                {t(`role.roles`, { role: role.id.replaceAll(`-`, ``) })}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-row gap-x-4">
      {user.avatar && (
        <div className="w-64">
          <div className="relative aspect-auto w-full max-w-md overflow-hidden rounded-lg">
            <Image
              src={user.avatar}
              alt={user.name}
              width={800}
              height={600}
              className="h-auto w-full rounded-lg object-contain"
            />
          </div>
        </div>
      )}

      <div className="flex w-full flex-col gap-y-2">
        <ContentTitle module={Modules.User} type={title.type} element={title.element} functions={title.functions} />
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
        {roles}
        <AttributeElement inline={true} title={t(`user.fields.title.label`)} value={user.title} />
        <AttributeElement inline={true} title={t(`common.fields.email.label`)} value={user.email} />
        <AttributeElement inline={false} title={t(`user.fields.bio.label`)} value={user.bio} />
      </div>
    </div>
  );
}
