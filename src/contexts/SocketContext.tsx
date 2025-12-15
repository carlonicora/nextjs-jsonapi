"use client";

import React, { createContext, useContext } from "react";
import { NotificationInterface } from "../features/notification/data";
import { useSocket } from "../hooks";

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
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ token, children }) => {
  const socketHookData = token ? useSocket({ token }) : null;

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
