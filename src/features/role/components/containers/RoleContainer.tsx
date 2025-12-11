"use client";

import { RoleUsersList } from "../../../user/components/lists/RoleUsersList";
import { useRoleContext } from "../../contexts";
import { RoleDetails } from "../details";

export function RoleContainer() {
  const { role } = useRoleContext();

  if (!role) return null;

  return (
    <>
      <RoleDetails />
      <RoleUsersList role={role} />
    </>
  );
}
