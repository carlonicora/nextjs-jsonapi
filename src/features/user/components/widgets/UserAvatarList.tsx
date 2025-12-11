"use client";

import { Modules } from "../../../../core";
import { usePageUrlGenerator } from "../../../../hooks";
import { Link } from "../../../../shadcnui";
import { UserInterface } from "../../data";
import { UserAvatar } from "./UserAvatar";

type UserAvatarListProps = {
  users: UserInterface[];
};

export function UserAvatarList({ users }: UserAvatarListProps) {
  const generateUrl = usePageUrlGenerator();

  return (
    <div className="flex flex-row items-center">
      <div className="flex flex-row-reverse justify-end -space-x-1 space-x-reverse">
        {users.map((user: UserInterface) => (
          <Link
            key={user.id}
            href={generateUrl({ page: Modules.User, id: user.id })}
            onClick={(e) => e.stopPropagation()}
          >
            <UserAvatar user={user} className="h-5 w-5" />
          </Link>
        ))}
      </div>
    </div>
  );
}
