"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  CommonAssociationCommandDialog,
  CommonAssociationTrigger,
  triggerAssociationToast,
  UserListInAdd,
} from "../../../../components";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../hooks";
import { RoleInterface, RoleService } from "../../../role";
import { useCurrentUserContext } from "../../contexts";
import { UserInterface, UserService } from "../../data";

type AddUserToRoleProps = {
  role: RoleInterface;
  refresh: () => Promise<void>;
};

function AddUserToRoleInternal({ role, refresh }: AddUserToRoleProps) {
  const { company } = useCurrentUserContext<UserInterface>();
  const [show, setShow] = useState<boolean>(false);
  const [users, setUsers] = useState<UserInterface[]>([]);
  const t = useTranslations();

  const [existingUsers, setExistingUsers] = useState<UserInterface[] | null>(null);
  useEffect(() => {
    const fetchExistingUsers = async () => {
      setExistingUsers(await UserService.findMany({ roleId: role.id, fetchAll: true }));
    };
    if (show) {
      setExistingUsers(null);
      fetchExistingUsers();
    }
  }, [show]);

  const addUserToRole = async (user: UserInterface) => {
    await RoleService.addUserToRole({
      roleId: role.id,
      userId: user.id,
    });
    setUsers(users.filter((u) => u.id !== user.id));

    triggerAssociationToast({
      t: t,
      source: t(`types.users`, { count: 1 }),
      destination: t(`types.roles`, { count: 1 }),
      source_name: user.name,
      destination_name: t(`foundations.role.roles`, { role: role.id.replaceAll(`-`, ``) }),
    });

    refresh();
  };

  const data: DataListRetriever<UserInterface> = useDataListRetriever({
    ready: !!company && show,
    retriever: (params) => UserService.findAllUsers(params),
    retrieverParams: { companyId: company?.id },
    module: Modules.User,
  }) as DataListRetriever<UserInterface>;

  useEffect(() => {
    if (!!company && show) {
      data.setReady(true);
    }
  }, [data, company, show]);

  return (
    <>
      <CommonAssociationTrigger
        sourceType={t(`types.users`, { count: 1 })}
        destinationType={t(`types.roles`, { count: 1 })}
        onTrigger={() => setShow(true)}
      />
      <CommonAssociationCommandDialog
        show={show}
        setShow={setShow}
        data={data}
        source={t(`types.users`, { count: 1 })}
        destination={t(`types.roles`, { count: 1 })}
        destinationName={t(`foundations.role.roles`, { role: role.id.replaceAll(`-`, ``) })}
      >
        <UserListInAdd data={data} existingUsers={existingUsers} setSelectedUser={addUserToRole} />
      </CommonAssociationCommandDialog>
    </>
  );
}

export function AddUserToRole(props: AddUserToRoleProps) {
  return <AddUserToRoleInternal {...props} />;
}
