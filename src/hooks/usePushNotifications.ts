"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ENV } from "../core/env";
import { UserInterface } from "../features/user/data";
import { PushService } from "../features/push/data/push.service";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const PUSH_REGISTERED_KEY_PREFIX = "push_registered_";

/** How long logout waits for the browser to drop its push subscription. */
const UNSUBSCRIBE_TIMEOUT_MS = 2000;

export type PushNotificationsState = {
  /** Push API + canSubscribe + non-empty ENV.VAPID_PUBLIC_KEY. */
  supported: boolean;
  /** "default" when the Notification API is missing. */
  permission: NotificationPermission;
  busy: boolean;
  enable: () => Promise<void>;
  refreshPermission: () => void;
};

function readPermission(): NotificationPermission {
  return typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default";
}

/** Registers the push service worker. */
function ensureWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
}

/**
 * Subscribes this browser to push (key check first) and registers the
 * subscription with the API, skipping the post when this tab already
 * registered the same subscription.
 */
async function subscribeAndRegisterOnce(registration: ServiceWorkerRegistration, userId: string): Promise<void> {
  const sessionKey = `${PUSH_REGISTERED_KEY_PREFIX}${userId}`;

  const vapidPublicKey = ENV.VAPID_PUBLIC_KEY.trim();
  if (!vapidPublicKey) {
    return;
  }
  const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    const appServerKey = new Uint8Array(Array.from(convertedKey));

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: appServerKey,
    });
  }

  const plainSubscription = {
    endpoint: subscription.endpoint,
    keys: subscription.toJSON().keys,
  };

  // Create a simple hash to detect subscription changes
  const subscriptionHash = btoa(JSON.stringify(plainSubscription));

  // Read the stored hash right before posting, not at the top: a rotation
  // that lands while this registration awaits must not be posted twice.
  if (sessionStorage.getItem(sessionKey) !== subscriptionHash) {
    await PushService.register({ data: plainSubscription });
    // Store the current subscription hash to avoid duplicate registrations
    sessionStorage.setItem(sessionKey, subscriptionHash);
  }
}

/**
 * Removes this browser's push subscription at logout. Clears the per-tab
 * registration markers first, then unsubscribes. It never throws and never
 * waits more than 2 s, so a hanging push service cannot block the logout.
 */
export async function unsubscribeFromPush(): Promise<void> {
  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(PUSH_REGISTERED_KEY_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => sessionStorage.removeItem(key));
  } catch (error) {
    console.error("Error clearing push registration markers:", error);
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      (async () => {
        const registration = await navigator.serviceWorker?.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        await subscription?.unsubscribe();
      })().catch((error) => console.error("Error unsubscribing from push:", error)),
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, UNSUBSCRIBE_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    console.error("Error unsubscribing from push:", error);
  } finally {
    clearTimeout(timer);
  }
}

export function usePushNotifications(params: {
  currentUser: Pick<UserInterface, "id"> | undefined;
  canSubscribe: boolean;
}): PushNotificationsState {
  const { currentUser, canSubscribe } = params;
  const userId = currentUser?.id;

  // Server-safe initial state: nothing reads window, navigator, Notification or
  // PushManager during render, so the server and the first client render match.
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [busy, setBusy] = useState(false);

  // The on-load flow and enable() can reach the subscribe step together; the
  // second caller joins the run already in flight instead of starting another.
  const inFlight = useRef<Promise<void> | null>(null);
  const subscribeAndRegister = useCallback((registration: ServiceWorkerRegistration, id: string): Promise<void> => {
    if (!inFlight.current) {
      inFlight.current = subscribeAndRegisterOnce(registration, id).finally(() => {
        inFlight.current = null;
      });
    }
    return inFlight.current;
  }, []);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window &&
        canSubscribe &&
        ENV.VAPID_PUBLIC_KEY.trim() !== "",
    );
    setPermission(readPermission());
  }, [canSubscribe]);

  const refreshPermission = useCallback(() => {
    setPermission(readPermission());
  }, []);

  const enable = useCallback(async (): Promise<void> => {
    try {
      // First statement, nothing awaited before it: Safari only shows the
      // prompt when it is asked for inside the click's own task.
      const asked = Notification.requestPermission();
      setBusy(true);
      const answer = await asked;
      setPermission(answer);
      if (answer === "granted" && userId) {
        await subscribeAndRegister(await ensureWorker(), userId);
      }
    } catch (error) {
      console.error("Error during service worker registration or push subscription:", error);
    } finally {
      setBusy(false);
    }
  }, [userId, subscribeAndRegister]);

  useEffect(() => {
    if (!userId || !canSubscribe) return;

    const register = async () => {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        try {
          const registration = await ensureWorker();

          // Check current permission status first
          let current = Notification.permission;

          // Only request permission if it's not already determined
          if (current === "default") {
            current = await Notification.requestPermission();
          }
          setPermission(current);

          if (current !== "granted") {
            return; // User denied permission, this is not an error
          }

          await subscribeAndRegister(registration, userId);
        } catch (error) {
          console.error("Error during service worker registration or push subscription:", error);
        }
      }
    };

    register();
  }, [userId, canSubscribe, subscribeAndRegister]);

  // When the worker re-subscribes after the push service rotates the subscription
  // (pushsubscriptionchange), it cannot call the authenticated API itself: it posts
  // the new subscription to one window client, and this tab re-registers it under
  // the user's auth, with the same hash guard as the registration above.
  useEffect(() => {
    if (!userId || !canSubscribe) return;
    if (!("serviceWorker" in navigator)) return;

    const sessionKey = `${PUSH_REGISTERED_KEY_PREFIX}${userId}`;

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== "PUSH_RESUBSCRIBED" || !event.data.subscription) return;

      const subscription = event.data.subscription;
      const subscriptionHash = btoa(JSON.stringify(subscription));
      if (sessionStorage.getItem(sessionKey) === subscriptionHash) return;

      void PushService.register({ data: subscription })
        .then(() => sessionStorage.setItem(sessionKey, subscriptionHash))
        .catch((error) => console.error("Error re-registering rotated push subscription:", error));
    };

    const container = navigator.serviceWorker;
    container.addEventListener("message", onMessage);
    return () => container.removeEventListener("message", onMessage);
  }, [userId, canSubscribe]);

  return useMemo(
    () => ({ supported, permission, busy, enable, refreshPermission }),
    [supported, permission, busy, enable, refreshPermission],
  );
}

export default usePushNotifications;
