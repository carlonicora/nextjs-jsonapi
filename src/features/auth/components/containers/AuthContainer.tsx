"use client";

import Image from "next/image";
import { Card } from "../../../../shadcnui";
import { AuthContextProvider, useAuthContext } from "../../contexts";
import { AuthComponent } from "../../enums";

type AuthContainerProps = {
  componentType: AuthComponent;
  params?: { code?: string };
};

export function AuthContainer({ componentType, params }: AuthContainerProps) {
  return (
    <AuthContextProvider initialComponentType={componentType} initialParams={params}>
      <InnerAuthContainer />
    </AuthContextProvider>
  );
}

function InnerAuthContainer() {
  const { activeComponent } = useAuthContext();

  if (activeComponent === null)
    return (
      <div className="max-w-sm">
        <Image src="/logo.webp" alt="Logo" width={100} height={100} className="animate-spin-slow" priority />
      </div>
    );

  // Phone: 40px buttons and inputs on the auth forms (login, register, reset…)
  // so they are comfortable to tap. Input-group buttons (show password) carry
  // data-size and keep their own size. md+ is unchanged.
  return (
    <Card className="w-full max-w-md max-md:[&_[data-slot=button]:not([data-size])]:h-10 max-md:[&_[data-slot=input-group-control]]:h-full max-md:[&_[data-slot=input-group]]:h-10 max-md:[&_[data-slot=input]]:h-10">
      {activeComponent}
    </Card>
  );
}
