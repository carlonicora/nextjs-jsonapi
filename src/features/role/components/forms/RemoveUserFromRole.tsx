"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { errorToast } from "../../../../components";
import { getRoleId } from "../../../../roles";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../../shadcnui";
import { UserInterface, UserService } from "../../../user";
import { RoleInterface, RoleService } from "../../data";

type RemoveUserFromRoleProps = {
  user: UserInterface;
  role: RoleInterface;
  refresh: () => Promise<void>;
};

export function RemoveUserFromRole({ role, user, refresh }: RemoveUserFromRoleProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [canRemove, setCanRemove] = useState<boolean>(false);
  const t = useTranslations();

  useEffect(() => {
    async function checkCompanyAdminDeletability(): Promise<void> {
      const roleUsers = await UserService.findAllUsersByRole({
        roleId: role.id,
      });

      if (roleUsers.length > 1) setCanRemove(true);
    }

    if (role.id !== getRoleId().CompanyAdministrator) {
      setCanRemove(true);
      return;
    }

    checkCompanyAdminDeletability();
  }, [role]);

  const remove = async () => {
    try {
      await RoleService.removeUserFromRole({
        roleId: role.id,
        userId: user.id,
      });

      setOpen(false);
      refresh();
    } catch (error) {
      errorToast({ title: t(`generic.errors.error`), error: error });
    }
  };

  const roleName = t(`foundations.role.roles`, { role: role.id.replaceAll(`-`, ``) });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
      >
        <span className="hover:text-destructive cursor-pointer">{t(`foundations.role.remove_user.title`)}</span>
      </DialogTrigger>
      <DialogContent className={`flex max-h-[70vh] max-w-3xl flex-col overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>{t(`foundations.role.remove_user.title`)}</DialogTitle>
          <DialogDescription>
            {canRemove
              ? t(`foundations.role.remove_user.subtitle_allowed`)
              : t(`foundations.role.remove_user.subtitle_not_allowed`)}
          </DialogDescription>
        </DialogHeader>
        {canRemove ? (
          <>
            {t(`foundations.role.remove_user.description_allowed`, { role: roleName, user: user.name })}
            <div className="flex justify-end">
              <Button className="mr-2" variant={"outline"} type={`button`} onClick={() => setOpen(false)}>
                {t(`generic.buttons.cancel`)}
              </Button>
              <Button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  remove();
                }}
                variant={"destructive"}
              >
                {t(`generic.buttons.confirm_delete`)}
              </Button>
            </div>
          </>
        ) : (
          <>{t(`foundations.role.remove_user.description_not_allowed`, { role: roleName, user: user.name })}</>
        )}
      </DialogContent>
    </Dialog>
  );
}
