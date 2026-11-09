"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useI18nRouter, usePageUrlGenerator } from "../../../hooks";
import { UserInterface } from "../../user";
import { useCurrentUserContext } from "../../user/contexts";
import { useAuthContext } from "../contexts";
import { TwoFactorChallengeInterface } from "../data/two-factor-challenge.interface";
import { AuthComponent } from "../enums";

/**
 * Post-login handling shared by Login and the invite sign-up in Register:
 * opens the two-factor challenge when one is pending, otherwise stores the
 * user and redirects to the callback URL or home.
 */
export function useCompleteLogin(): (response: UserInterface | TwoFactorChallengeInterface) => void {
  const { setUser } = useCurrentUserContext<UserInterface>();
  const { setComponentType, setPendingTwoFactor } = useAuthContext();
  const generateUrl = usePageUrlGenerator();
  const i18nRouter = useI18nRouter();
  const nativeRouter = useRouter(); // For URLs that already include locale
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  return useCallback(
    (response: UserInterface | TwoFactorChallengeInterface) => {
      // Check if 2FA is required (response is TwoFactorChallengeInterface)
      if ("pendingToken" in response) {
        setPendingTwoFactor(response as TwoFactorChallengeInterface);
        setComponentType(AuthComponent.TwoFactorChallenge);
        return;
      }

      setUser(response as UserInterface);

      // Use native router for callbackUrl since it already includes the locale prefix
      // Use i18n router for normal navigation which adds locale automatically
      if (callbackUrl) {
        nativeRouter.replace(callbackUrl);
      } else {
        i18nRouter.replace(generateUrl({ page: `/` }));
      }
    },
    [setUser, setComponentType, setPendingTwoFactor, generateUrl, i18nRouter, nativeRouter, callbackUrl],
  );
}
