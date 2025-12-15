"use client";

import { PlusCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "../../../../hooks";
import {
  Button,
  Command,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  DialogDescription,
  DialogTitle,
} from "../../../../shadcnui";
import { UserInterface } from "../../../user";
import { RoleInterface } from "../../data";
import { RoleService } from "../../data/role.service";

type UserRoleAddProps = {
  user: UserInterface;
  refresh: () => Promise<void>;
};

export function UserRoleAdd({ user, refresh }: UserRoleAddProps) {
  const [open, setOpen] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [roles, setRoles] = useState<RoleInterface[]>([]);
  const t = useTranslations();

  const addUserToRole = async (role: RoleInterface) => {
    await RoleService.addUserToRole({
      roleId: role.id,
      userId: user.id,
    });
    setRoles(roles.filter((u) => u.id !== role.id));

    toast.message(
      t(`generic.association.label`, {
        source: t(`types.roles`, { count: 1 }),
        destination: t(`types.users`, { count: 1 }),
      }),
      {
        description: t(`generic.association.success`, {
          source: t(`types.roles`, { count: 1 }),
          destination: t(`types.users`, { count: 1 }),
          source_name: role.name,
          destination_name: user.name,
        }),
      },
    );

    refresh();
  };

  const searchRoles = useCallback(
    async (term: string) => {
      setRoles(
        await RoleService.findAllRolesUserNotIn({
          search: term,
          userId: user.id,
        }),
      );
    },
    [searchTerm, user],
  );

  const updateSearchTerm = useDebounce(searchRoles, 500);

  useEffect(() => {
    if (open) updateSearchTerm(searchTerm);
  }, [open, searchTerm]);

  useEffect(() => {
    if (open) searchRoles("");
  }, [open]);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <PlusCircle className="mr-3 h-3.5 w-3.5" />
        {t(`generic.association.label`, {
          source: t(`types.roles`, { count: 1 }),
          destination: t(`types.users`, { count: 1 }),
        })}
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle>
          {t(`generic.association.label`, {
            source: t(`types.roles`, { count: 1 }),
            destination: t(`types.users`, { count: 1 }),
          })}
        </DialogTitle>
        <DialogDescription>
          {t(`generic.association.description`, {
            source: t(`types.roles`, { count: 1 }),
            destination: t(`types.users`, { count: 1 }),
            destination_name: user.name,
          })}
        </DialogDescription>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t(`generic.search.placeholder`, { type: t(`types.roles`, { count: 1 }) })}
            value={searchTerm}
            onValueChange={setSearchTerm}
            ref={inputRef}
          />
          <CommandList className="mt-3 h-auto max-h-96 min-h-96 max-w-full overflow-x-hidden overflow-y-auto">
            <CommandEmpty>{t(`generic.search.no_results`, { type: t(`types.roles`, { count: 1 }) })}</CommandEmpty>
            {roles.map((role: RoleInterface) => (
              <CommandItem
                className="cursor-pointer"
                key={role.id}
                onSelect={() => addUserToRole(role)}
                onClick={() => addUserToRole(role)}
              >
                {t(`foundations.role.roles`, { role: role.id.replaceAll(`-`, ``) })}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
