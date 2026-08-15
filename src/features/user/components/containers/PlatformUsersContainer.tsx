"use client";

import { RoundPageContainer } from "../../../../components";
import { Modules } from "../../../../core";
import { UserProvider } from "../../contexts/UserContext";
import { PlatformUsersList } from "../lists/PlatformUsersList";

/**
 * Page container for the platform-wide (cross-company) user list.
 *
 * Client component by necessity: `module={Modules.User}` is a registry entry
 * with an icon component and methods, which a Server Component cannot pass
 * across the boundary.
 */
export function PlatformUsersContainer() {
  return (
    <UserProvider>
      <RoundPageContainer module={Modules.User} fullWidth>
        <PlatformUsersList fullWidth />
      </RoundPageContainer>
    </UserProvider>
  );
}
