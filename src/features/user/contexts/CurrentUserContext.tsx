"use client";

import { getCookie } from "cookies-next";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { usePathname } from "next/navigation";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useSocketContext } from "../../../contexts/SocketContext";
import { Modules, rehydrate } from "../../../core";
import { Action, checkPermissions, ModuleWithPermissions } from "../../../permissions";
import { getRoleId } from "../../../roles";
import { getTokenHandler } from "../../auth/config";
import { CompanyInterface } from "../../company/data/company.interface";
import { FeatureInterface } from "../../feature";
import { RoleInterface } from "../../role";
import { UserInterface, UserService } from "../data";

export interface CurrentUserContextType<T extends UserInterface = UserInterface> {
  currentUser: T | null;
  company: CompanyInterface | null;
  setUser: (user?: T) => void;
  hasPermissionToModule: <M extends ModuleWithPermissions>(params: {
    module: M;
    action: Action;
    data?: any;
  }) => boolean;
  hasPermissionToModules: <M extends ModuleWithPermissions>(params: {
    modules: M[];
    action: Action;
    data?: any;
  }) => boolean;
  hasPermissionToPath: (path: string) => boolean;
  hasAccesToFeature: (featureIdentifier: string) => boolean;
  matchUrlToModule: (prarms?: { path: string }) => ModuleWithPermissions | undefined;
  hasRole: (roleId: string) => boolean;
  refreshUser: (options?: { skipCookieUpdate?: boolean }) => Promise<void>;
  isRefreshing: boolean;
}

const userAtom = atomWithStorage("user", null);

const CurrentUserContext = createContext<CurrentUserContextType | undefined>(undefined);

export const CurrentUserProvider = ({ children }: { children: React.ReactNode }) => {
  const path = usePathname();

  const [dehydratedUser, setDehydratedUser] = useAtom(userAtom);

  useEffect(() => {
    const token = getCookie("token");
    if (!token && dehydratedUser) setDehydratedUser(null);
  }, [dehydratedUser, setDehydratedUser]);

  const matchUrlToModule = (params?: { path: string }): ModuleWithPermissions | undefined => {
    const moduleKeys = Object.getOwnPropertyNames(Modules).filter(
      (key) => key !== "prototype" && key !== "_factory" && key !== "length" && key !== "name",
    );

    const matchedModuleKey = moduleKeys.find((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(Modules, key);

      if (!descriptor?.get) return false;

      const selectedModule = descriptor.get.call(Modules);

      return path.toLowerCase().startsWith(selectedModule.pageUrl?.toLowerCase());
    });

    if (!matchedModuleKey) return undefined;

    const descriptor = Object.getOwnPropertyDescriptor(Modules, matchedModuleKey);
    return descriptor?.get?.call(Modules);
  };

  const currentUser = dehydratedUser ? rehydrate<UserInterface>(Modules.User, dehydratedUser) : null;

  const company = currentUser?.company ?? null;

  const setUser = (user?: UserInterface): void => {
    if (user) setDehydratedUser(user.dehydrate() as any);
    else setDehydratedUser(null);
  };

  const hasRole = (roleId: string): boolean => {
    if (!currentUser) return false;

    return !!currentUser.roles?.some((userRole: RoleInterface) => userRole.id === roleId);
  };

  const hasAccesToFeature = (featureIdentifier: string): boolean => {
    if (hasRole(getRoleId().Administrator)) return true;
    if (!company) return false;

    return company.features.some((feature: FeatureInterface) => feature.id === featureIdentifier);
  };

  function hasPermissionToModule<M extends ModuleWithPermissions>(params: {
    module: M;
    action: Action;
    data?: M extends ModuleWithPermissions ? any : never;
  }): boolean {
    if (!currentUser) return false;

    if (!!params.module.feature && !hasAccesToFeature(params.module.feature)) return false;

    return checkPermissions({ module: params.module, action: params.action, data: params.data, user: currentUser });
  }

  function hasPermissionToModules<M extends ModuleWithPermissions>(params: {
    modules: M[];
    action: Action;
    data?: M extends ModuleWithPermissions ? any : never;
  }): boolean {
    if (!currentUser) return false;

    if (!params.modules.every((module) => !module.feature || hasAccesToFeature(module.feature))) return false;

    return params.modules.every((module) =>
      checkPermissions({ module: module, action: params.action, data: params.data, user: currentUser }),
    );
  }

  function hasPermissionToPath(path: string): boolean {
    if (!currentUser) return false;
    if (path === "#" || path === "/") return true;

    const selectedModule = matchUrlToModule({ path: path });
    if (!selectedModule) return true;

    const response = hasPermissionToModule({ module: selectedModule, action: Action.Read });

    return response;
  }

  // State for tracking refresh status
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to refresh user data from the API
  // skipCookieUpdate: When true, only updates React state without calling the Server Action
  // This prevents page reloads when refresh is triggered by WebSocket events
  const refreshUser = useCallback(async (options?: { skipCookieUpdate?: boolean }): Promise<void> => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    try {
      const fullUser = await UserService.findFullUser();
      if (fullUser) {
        const dehydrated = fullUser.dehydrate();

        setDehydratedUser(dehydrated as any);
        setUser(fullUser);

        // Update authentication cookies with fresh user data
        // Skip when triggered by WebSocket to prevent page reload (Server Actions modify cookies)
        if (!options?.skipCookieUpdate) {
          await getTokenHandler()?.updateToken({
            userId: fullUser.id,
            companyId: fullUser.company?.id,
            roles: fullUser.roles.map((role) => role.id),
            features: fullUser.company?.features?.map((feature) => feature.id) ?? [],
            modules: fullUser.modules.map((module) => ({
              id: module.id,
              permissions: module.permissions,
            })),
          });
        }
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, setDehydratedUser]);

  // WebSocket integration for real-time token updates
  const { socket, isConnected } = useSocketContext();

  // Use ref for stable refreshUser reference to avoid effect re-runs
  const refreshUserRef = useRef(refreshUser);
  refreshUserRef.current = refreshUser;

  // Track refresh in progress to prevent duplicate API calls
  const isRefreshingRef = useRef(false);

  // Listen for company WebSocket events that trigger user refresh
  useEffect(() => {
    if (!socket || !isConnected || !currentUser?.company?.id) {
      return;
    }

    const handleCompanyUpdate = (data: { companyId: string; type: string }) => {
      if (data.companyId === currentUser.company?.id && !isRefreshingRef.current) {
        isRefreshingRef.current = true;
        // Skip cookie update to prevent page reload - only update React state
        refreshUserRef.current({ skipCookieUpdate: true }).finally(() => {
          isRefreshingRef.current = false;
        });
      }
    };

    // Both events trigger the same refresh behavior
    socket.on("company:tokens_updated", handleCompanyUpdate);
    socket.on("company:subscription_updated", handleCompanyUpdate);

    return () => {
      socket.off("company:tokens_updated", handleCompanyUpdate);
      socket.off("company:subscription_updated", handleCompanyUpdate);
    };
  }, [socket, isConnected, currentUser?.company?.id]);

  return (
    <CurrentUserContext.Provider
      value={{
        currentUser: currentUser,
        company: company,
        setUser: setUser,
        hasPermissionToModule: hasPermissionToModule,
        hasPermissionToModules: hasPermissionToModules,
        hasPermissionToPath: hasPermissionToPath,
        hasAccesToFeature: hasAccesToFeature,
        matchUrlToModule: matchUrlToModule,
        hasRole: hasRole,
        refreshUser: refreshUser,
        isRefreshing: isRefreshing,
      }}
    >
      {children}
    </CurrentUserContext.Provider>
  );
};

export function useCurrentUserContext<T extends UserInterface = UserInterface>(): CurrentUserContextType<T> {
  const context = useContext(CurrentUserContext);
  if (context === undefined) {
    throw new Error("useCurrentUserContext must be used within a UserProvider");
  }
  return context as unknown as CurrentUserContextType<T>;
}
