"use client";

import { Modules } from "../../../../core";
import { usePageUrlGenerator } from "../../../../hooks";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Link,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../../../shadcnui";
import { cn } from "../../../../utils";
import { UserInterface } from "../../data";

type UserAvatarProps = {
  user: UserInterface;
  className?: string;
  showFull?: boolean;
  showLink?: boolean;
};

export function UserAvatar({ user, className, showFull, showLink }: UserAvatarProps) {
  const generateUrl = usePageUrlGenerator();

  const getInitial = (param?: string) => {
    if (!param) return "";
    return param[0].toUpperCase();
  };

  const getInitials = (name: string) => {
    const words = name.split(" ");
    const initials =
      words.length > 1 ? getInitial(words[0][0]) + getInitial(words[words.length - 1][0]) : getInitial(words[0][0]);

    return initials ?? "";
  };

  const getAvatar = () => {
    return (
      <div className="*:ring-border *:ring-1">
        <Avatar className={`h-6 w-6 ${className}`}>
          <AvatarImage className="object-cover" src={user?.avatar} />
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
      </div>
    );
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {showLink === false ? (
          // If showLink is explicitly false, never show a link
          showFull ? (
            <div className={cn(`mb-2 flex w-full flex-row items-center justify-start gap-x-2 text-sm`, className)}>
              {getAvatar()}
              {user.name}
            </div>
          ) : (
            getAvatar()
          )
        ) : showFull ? (
          <Link
            href={generateUrl({ page: Modules.User, id: user.id })}
            className={cn(`mb-2 flex w-full flex-row items-center justify-start gap-x-2 text-sm`, className)}
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
          >
            <div className="flex w-full flex-row items-center gap-x-2">
              {getAvatar()}
              {user.name}
            </div>
          </Link>
        ) : showLink ? (
          <Link href={generateUrl({ page: Modules.User, id: user.id })} className={className}>
            {getAvatar()}
          </Link>
        ) : (
          getAvatar()
        )}
      </TooltipTrigger>
      <TooltipContent>{user.name}</TooltipContent>
    </Tooltip>
  );
}
