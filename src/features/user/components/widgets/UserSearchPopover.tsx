"use client";

import { RefreshCwIcon, SearchIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactNode, useEffect, useState } from "react";
import {
  Command,
  CommandItem,
  CommandList,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../shadcnui";
import { useUserSearch } from "../../hooks";
import { UserAvatar } from "./UserAvatar";

type UserSearchPopoverProps = {
  children: ReactNode;
  onSelect: (userId: string) => void;
  align?: "start" | "center" | "end";
  className?: string;
};

export const UserSearchPopover = ({ children, onSelect, align = "start", className }: UserSearchPopoverProps) => {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const { users, searchQuery, setSearchQuery, isLoading, loadUsers, clearSearch } = useUserSearch();

  useEffect(() => {
    if (isOpen && users.length === 0 && !searchQuery) {
      loadUsers("");
    }
  }, [isOpen, users.length, searchQuery, loadUsers]);

  const handleSelectUser = (userId: string) => {
    onSelect(userId);
    setIsOpen(false);
    clearSearch();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent align={align} onClick={(e) => e.stopPropagation()} className={className ?? "w-80"}>
        <Command shouldFilter={false}>
          <div className="relative mb-2 w-full">
            <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              placeholder={t(`generic.search.placeholder`, { type: t(`types.users`, { count: 1 }) })}
              type="text"
              className="w-full pr-8 pl-8"
              onChange={(e) => setSearchQuery(e.target.value)}
              value={searchQuery}
              onClick={(e) => e.stopPropagation()}
            />
            {isLoading ? (
              <RefreshCwIcon className="text-muted-foreground absolute top-2.5 right-2.5 h-4 w-4 animate-spin" />
            ) : searchQuery ? (
              <XIcon
                className="text-muted-foreground hover:text-foreground absolute top-2.5 right-2.5 h-4 w-4 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  clearSearch();
                }}
              />
            ) : null}
          </div>
          <CommandList>
            {users.length > 0 ? (
              users.map((user) => (
                <CommandItem key={user.id} className="cursor-pointer" onSelect={() => handleSelectUser(user.id)}>
                  <UserAvatar user={user} className="mr-2 h-4 w-4" showLink={false} />
                  <span>{user.name}</span>
                </CommandItem>
              ))
            ) : (
              <div className="text-muted-foreground py-6 text-center text-sm">
                {isLoading
                  ? t(`generic.loading`)
                  : t(`generic.search.no_results`, { type: t(`types.users`, { count: 1 }) })}
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
