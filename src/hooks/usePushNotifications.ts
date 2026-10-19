"use client";

import { useEffect } from "react";
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

export function usePushNotifications(params: {
  currentUser: UserInterface | undefined;
  canSubscribe: boolean;
}): void {
  const { currentUser, canSubscribe } = params;
  const userId = currentUser?.id;

  useEffect(() => {
    if (!userId || !canSubscribe) return;

    const register = async () => {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        try {
          const sessionKey = `push_registered_${userId}`;

          const registration = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });

          // Check current permission status first
          let permission = Notification.permission;

          // Only request permission if it's not already determined
          if (permission === "default") {
            permission = await Notification.requestPermission();
          }

          if (permission !== "granted") {
            return; // User denied permission, this is not an error
          }

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
        } catch (error) {
          console.error("Error during service worker registration or push subscription:", error);
        }
      }
    };

    register();
  }, [userId, canSubscribe]);

  // When the worker re-subscribes after the push service rotates the subscription
  // (pushsubscriptionchange), it cannot call the authenticated API itself: it posts
  // the new subscription to one window client, and this tab re-registers it under
  // the user's auth, with the same hash guard as the registration above.
  useEffect(() => {
    if (!userId || !canSubscribe) return;
    if (!("serviceWorker" in navigator)) return;

    const sessionKey = `push_registered_${userId}`;

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
}

export default usePushNotifications;
