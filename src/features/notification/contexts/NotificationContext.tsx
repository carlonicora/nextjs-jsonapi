"use client";

import { useTranslations } from "next-intl";
import React, { createContext, ReactElement, useCallback, useContext, useState } from "react";
import { SharedProvider } from "../../../contexts";
import { Modules } from "../../../core";
import { useI18nRouter } from "../../../i18n";
import { BreadcrumbItemData } from "../../../interfaces";
import { NotificationMenuItem, NotificationToast } from "../components/notifications/Notification";
import { NotificationInterface } from "../data";
import { NotificationService } from "../data/notification.service";

interface NotificationContextType {
  notifications: NotificationInterface[];
  setNotifications: (notifications: NotificationInterface[]) => void;
  addNotification: (notification: NotificationInterface) => void;
  addSocketNotifications: (socketNotifications: NotificationInterface[]) => void;
  loadNotifications: () => Promise<void>;
  generateNotification: (notification: NotificationInterface, closePopover: () => void) => ReactElement<any>;
  generateToastNotification: (
    notification: NotificationInterface,
    t: any,
    generateUrl: any,
  ) => {
    title: string;
    description: string | ReactElement<any>;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  markNotificationsAsRead: (ids: string[]) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  lastLoaded: number;
  shouldRefresh: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

type NotificationContextProviderProps = {
  children: React.ReactNode;
};

export const NotificationContextProvider = ({ children }: NotificationContextProviderProps) => {
  const t = useTranslations();
  const router = useI18nRouter();

  const [notifications, setNotifications] = useState<NotificationInterface[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLoaded, setLastLoaded] = useState(0);

  // Calculate shouldRefresh (5 minute cache)
  const shouldRefresh = Date.now() - lastLoaded > 5 * 60 * 1000;

  const addNotification = useCallback((notification: NotificationInterface) => {
    setNotifications((prev) => {
      // Check if notification already exists to prevent duplicates
      const exists = prev.some((n) => n.id === notification.id);
      if (exists) return prev;
      return [notification, ...prev];
    });
  }, []);

  const addSocketNotifications = useCallback((socketNotifications: NotificationInterface[]) => {
    setNotifications((prev) => {
      const newNotifications = socketNotifications.filter(
        (newNotif) => !prev.some((existingNotif) => existingNotif.id === newNotif.id),
      );
      return [...prev, ...newNotifications];
    });
  }, []);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedNotifications = await NotificationService.findMany({});
      setNotifications(fetchedNotifications);
      setLastLoaded(Date.now());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load notifications";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markNotificationsAsRead = useCallback(async (ids: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const data: any = {
        data: ids.map((id: string) => ({
          type: Modules.Notification.name,
          id: id,
          attributes: {
            isRead: true,
          },
          meta: {},
          relationships: {},
        })),
      };

      await NotificationService.markAsRead({ data: data });
      const allNotifications = await NotificationService.findMany({});
      setNotifications(allNotifications);
      setLastLoaded(Date.now());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to mark notifications as read";
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateToastNotification = (
    notification: NotificationInterface,
    t: any,
    generateUrl: any,
  ): {
    title: string;
    description: string | ReactElement<any>;
    action?: {
      label: string;
      onClick: () => void;
    };
  } => {
    return NotificationToast(notification, t, generateUrl, router);
  };

  const generateNotification = (notification: NotificationInterface, closePopover: () => void) => {
    return <NotificationMenuItem notification={notification} closePopover={closePopover} />;
  };

  const breadcrumb = () => {
    const response: BreadcrumbItemData[] = [];

    response.push({
      name: t(`types.notifications`, { count: 2 }),
    });

    return response;
  };

  const title = () => {
    const response: any = {
      type: t(`types.notifications`, { count: 2 }),
    };

    return response;
  };

  return (
    <SharedProvider value={{ breadcrumbs: breadcrumb(), title: title() }}>
      <NotificationContext.Provider
        value={{
          notifications,
          setNotifications,
          addNotification,
          addSocketNotifications,
          loadNotifications,
          generateNotification,
          generateToastNotification,
          markNotificationsAsRead,
          isLoading,
          error,
          lastLoaded,
          shouldRefresh,
        }}
      >
        {children}
      </NotificationContext.Provider>
    </SharedProvider>
  );
};

export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(`Notification.messages.errors.use_context`);
  }
  return context;
};
