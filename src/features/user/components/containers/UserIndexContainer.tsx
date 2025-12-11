"use client";

import { PageContentContainer } from "../../../../components";
import { useUserContext } from "../../contexts";
import { UserIndexDetails } from "../details";

export function UserIndexContainer() {
  const { user } = useUserContext();
  if (!user) return null;

  return <PageContentContainer details={<UserIndexDetails />} />;
}
