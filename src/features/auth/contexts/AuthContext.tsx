"use client";

import { createContext, ReactElement, useContext, useMemo, useState } from "react";
import {
  AcceptInvitation,
  ActivateAccount,
  ForgotPassword,
  LandingComponent,
  Login,
  ResetPassword,
} from "../components";
import Register from "../components/forms/Register";
import { AuthComponent } from "../enums";

interface AuthContextType {
  activeComponent: ReactElement<any> | null;
  setComponentType: (componentType: AuthComponent) => void;
  setParams: (params?: { code?: string }) => void;
  params?: { code?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider = ({
  children,
  initialComponentType,
  initialParams,
}: {
  children: React.ReactNode;
  initialComponentType?: AuthComponent;
  initialParams?: { code?: string };
}) => {
  const [componentType, setComponentType] = useState<AuthComponent | undefined>(initialComponentType);
  const [params, setParams] = useState<{ code?: string } | undefined>(initialParams);

  const activeComponent = useMemo(() => {
    if (componentType === undefined) return null;

    switch (componentType) {
      case AuthComponent.Login:
        return <Login />;
      case AuthComponent.Register:
        return <Register />;
      case AuthComponent.ForgotPassword:
        return <ForgotPassword />;
      case AuthComponent.ActivateAccount:
        return <ActivateAccount />;
      case AuthComponent.ResetPassword:
        return <ResetPassword />;
      case AuthComponent.AcceptInvitation:
        return <AcceptInvitation />;
      default:
        return <LandingComponent />;
    }
  }, [componentType]);

  return (
    <AuthContext.Provider
      value={{
        activeComponent,
        setComponentType,
        setParams,
        params,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within a AuthComponentProvider");
  }
  return context;
};
