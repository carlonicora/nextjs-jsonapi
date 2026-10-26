"use client";

import { useTranslations } from "next-intl";
import { createContext, ReactNode, useContext, useState } from "react";
import { SharedProvider } from "../../../contexts";
import { JsonApiHydratedDataInterface, Modules, rehydrate } from "../../../core";
import { usePageUrlGenerator } from "../../../hooks";
import { BreadcrumbItemData } from "../../../interfaces";
import { Action } from "../../../permissions";
import { getRoleId } from "../../../roles";
import {
  AccountDeletionAdminTrigger,
  isAccountDeletionEnabled,
} from "../../account-deletion/components/AccountDeletionAdminTrigger";
import { UserDeleter, UserEditor, UserReactivator, UserResentInvitationEmail } from "../components/forms";
import { UserInterface } from "../data";
import { useCurrentUserContext } from "./CurrentUserContext";

interface UserContextType {
  user: UserInterface | undefined;
  setUser: (value: UserInterface | undefined) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * The platform-wide user list administrators use (PlatformUsersContainer). The
 * User module's own `pageUrl` (/users) is the company-scoped list, which a
 * system administrator, who belongs to no company, sees empty. Same path
 * convention as the hrefs in AdminIndexContainer.
 */
const USERS_ADMIN_PAGE_URL = "/administration/users";

type UserProviderProps = {
  children: ReactNode;
  dehydratedUser?: JsonApiHydratedDataInterface;
};

export const UserProvider = ({ children, dehydratedUser }: UserProviderProps) => {
  const generateUrl = usePageUrlGenerator();
  const { hasPermissionToModule, hasRole } = useCurrentUserContext<UserInterface>();
  const t = useTranslations();

  const [user, setUser] = useState<UserInterface | undefined>(
    dehydratedUser ? rehydrate<UserInterface>(Modules.User, dehydratedUser) : undefined,
  );

  const breadcrumb = () => {
    const response: BreadcrumbItemData[] = [];

    // Administrators are checked by role, as CompanyProvider does: an app may
    // grant them no module permission, and their list is the administration one.
    const isAdministrator = hasRole(getRoleId().Administrator);

    // The list root comes first, linked ONLY when it is not the current page
    // (same rule as CompanyProvider).
    if (isAdministrator || hasPermissionToModule({ module: Modules.User, action: Action.Update })) {
      response.push({
        name: t(`entities.users`, { count: 2 }),
        ...(user ? { href: generateUrl({ page: isAdministrator ? USERS_ADMIN_PAGE_URL : Modules.User }) } : {}),
      });
    }

    if (user)
      response.push({
        name: `${user.name}${user.isDeleted ? ` (${t(`user.deleted`)})` : ""}`,
        href: generateUrl({ page: Modules.User, id: user.id }),
      });

    return response;
  };

  const title = () => {
    const response: any = {
      type: t(`entities.users`, { count: user ? 1 : 2 }),
    };

    const functions: ReactNode[] = [];

    if (user) {
      response.element = `${user.name}${user.isDeleted ? ` (${t(`user.deleted`)})` : ""}`;

      if (user.isDeleted) {
        functions.push(<UserReactivator key={`UserReactivator`} user={user} propagateChanges={setUser} />);
      } else {
        if (!user.isActivated)
          functions.push(<UserResentInvitationEmail key={`UserResentInvitationEmail`} user={user} />);

        functions.push(<UserDeleter key={`UserDeleter`} user={user} />);

        // Opt-in: only apps that registered AccountDeletionModule, platform administrators only.
        if (hasRole(getRoleId().Administrator) && isAccountDeletionEnabled())
          functions.push(<AccountDeletionAdminTrigger key={`AccountDeletionAdminTrigger`} user={user} />);
      }

      functions.push(<UserEditor key={`UserEditor`} user={user} propagateChanges={setUser} />);
    }

    if (functions.length > 0) response.functions = functions;

    return response;
  };

  return (
    <SharedProvider value={{ breadcrumbs: breadcrumb(), title: title() }}>
      <UserContext.Provider
        value={{
          user: user,
          setUser: setUser,
        }}
      >
        {children}
      </UserContext.Provider>
    </SharedProvider>
  );
};

export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
