"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { NotificationInterface } from "../features/notification/data";
import { useSocket } from "../hooks";
import type { SessionSnapshot } from "../server/ServerSession";

interface SocketContextProps {
  socket: ReturnType<typeof useSocket>["socket"];
  isConnected: boolean;
  messages: any[];
  socketNotifications: NotificationInterface[];
  sendMessage: (event: string, data: any) => void;
  removeMessage: (index: number) => void;
  removeSocketNotification: (index: number) => void;
  clearMessages: () => void;
  clearSocketNotifications: () => void;
}

const defaultContextValue: SocketContextProps = {
  socket: null,
  isConnected: false,
  messages: [],
  socketNotifications: [],
  sendMessage: () => {},
  removeMessage: () => {},
  removeSocketNotification: () => {},
  clearMessages: () => {},
  clearSocketNotifications: () => {},
};

export const SocketContext = createContext<SocketContextProps>(defaultContextValue);

interface SocketProviderProps {
  token?: string;
  /**
   * The request's session snapshot as a promise. The token is resolved in an
   * effect, so this provider never suspends and its children render at once;
   * the socket connects when the promise settles.
   */
  session?: Promise<SessionSnapshot>;
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ token, session, children }) => {
  const [sessionToken, setSessionToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!session) return;
    let active = true;
    // Callback form: a server-passed promise's then() returns undefined, so it
    // cannot be chained (see utils/map-thenable).
    session.then(
      (snapshot) => {
        if (active) setSessionToken(snapshot.token);
      },
      () => {},
    );
    return () => {
      active = false;
    };
  }, [session]);

  const resolvedToken = token ?? sessionToken;
  // Called unconditionally: useSocket returns early while the token is falsy.
  const socketHookData = useSocket({ token: resolvedToken as string });

  const sendMessage = (event: string, data: any) => {
    const currentSocket = socketHookData ? socketHookData.socket : defaultContextValue.socket;
    const currentIsConnected = socketHookData ? socketHookData.isConnected : defaultContextValue.isConnected;

    if (currentSocket && currentIsConnected) {
      currentSocket.emit(event, data);
    }
  };

  const value: SocketContextProps = {
    ...defaultContextValue,
    ...(socketHookData || {}),
    sendMessage: sendMessage,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocketContext must be used within a SocketProvider");
  }
  return context;
};
