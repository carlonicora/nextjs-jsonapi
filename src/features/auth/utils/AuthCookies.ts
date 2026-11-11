// Server-only cookie utilities (consumers should provide their own server actions via configureAuth)

import { ENV } from "../../../core/env";
import { cookies } from "next/headers";

export async function updateToken(params: {
  token?: string;
  refreshToken?: string;
  userId?: string;
  companyId?: string;
  roles?: string[];
  features?: string[];
}): Promise<void> {
  const isProduction = ENV.IS_PRODUCTION;

  if (params.token)
    (await cookies()).set({
      name: "token",
      value: params.token,
      httpOnly: false,
      path: "/",
      secure: isProduction,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });
  if (params.refreshToken)
    (await cookies()).set({
      name: "refreshToken",
      value: params.refreshToken,
      httpOnly: true,
      path: "/",
      secure: isProduction,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    });

  if (params.userId)
    (await cookies()).set({
      name: "userId",
      value: params.userId,
      httpOnly: true,
      path: "/",
      secure: isProduction,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    });

  if (params.companyId)
    (await cookies()).set({
      name: "companyId",
      value: params.companyId,
      httpOnly: true,
      path: "/",
      secure: isProduction,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    });

  if (params.roles)
    (await cookies()).set({
      name: "roles",
      value: JSON.stringify(params.roles),
      httpOnly: true,
      path: "/",
      secure: isProduction,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    });

  if (params.features)
    (await cookies()).set({
      name: "features",
      value: JSON.stringify(params.features),
      httpOnly: true,
      path: "/",
      secure: isProduction,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    });
}

export async function removeToken(): Promise<void> {
  (await cookies()).delete({
    name: "token",
  });
  (await cookies()).delete({
    name: "refreshToken",
  });
  (await cookies()).delete({
    name: "userId",
  });
  (await cookies()).delete({
    name: "companyId",
  });
  (await cookies()).delete({
    name: "roles",
  });
  (await cookies()).delete({
    name: "features",
  });
  // Clears the modules cookie that sessions from older versions still carry.
  (await cookies()).delete({
    name: "modules",
  });
}
