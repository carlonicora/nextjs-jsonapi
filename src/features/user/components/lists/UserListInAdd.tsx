"use client";

import React from "react";
import { DataListRetriever } from "../../../../hooks";
import { CommandItem } from "../../../../shadcnui";
import { UserInterface } from "../../data";
import { UserAvatar } from "../widgets";

type UserListInAddProps = {
  data: DataListRetriever<UserInterface>;
  existingUsers: UserInterface[] | null;
  setSelectedUser: (user: UserInterface) => void;
  setLevelOpen?: (open: boolean) => void;
};

export function UserListInAdd({ data, existingUsers, setSelectedUser, setLevelOpen }: UserListInAddProps) {
  return (
    <>
      {data.data !== undefined &&
        (data.data as UserInterface[])
          .filter(
            (user: UserInterface) =>
              existingUsers && !existingUsers.find((existingUser: UserInterface) => existingUser.id === user.id),
          )
          .map((user: UserInterface) => {
            return (
              <React.Fragment key={user.id}>
                <CommandItem
                  className="cursor-pointer hover:bg-muted data-selected:hover:bg-muted bg-transparent data-selected:bg-transparent"
                  key={user.id}
                  onClick={(_e) => {
                    setSelectedUser(user);
                    setLevelOpen?.(true);
                  }}
                  onSelect={(_e) => {
                    setSelectedUser(user);
                    setLevelOpen?.(true);
                  }}
                >
                  <div className="flex w-full flex-row items-center justify-between px-4 py-1">
                    <UserAvatar user={user} />
                    <div className="ml-5 flex w-full flex-col">
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-xs font-normal">{user.email}</div>
                    </div>
                  </div>
                </CommandItem>
              </React.Fragment>
            );
          })}
    </>
  );
}
