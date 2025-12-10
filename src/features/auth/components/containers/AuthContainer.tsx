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
        <Image src="/phlow-logo.webp" alt="Phlow" width={100} height={100} className="animate-spin-slow" priority />
      </div>
    );

  return <Card className="w-full max-w-md">{activeComponent}</Card>;
}
