"use client";

import React, { useEffect, useMemo } from "react";
import { JsonApiConfig, JsonApiContext } from "./JsonApiContext";

export interface JsonApiProviderProps {
  config: JsonApiConfig;
  children: React.ReactNode;
}

export function JsonApiProvider({ config, children }: JsonApiProviderProps) {
  // Run bootstrapper on mount if provided
  useEffect(() => {
    if (config.bootstrapper) {
      config.bootstrapper();
    }
  }, [config.bootstrapper]);

  // Memoize config to prevent unnecessary re-renders
  const memoizedConfig = useMemo(() => config, [config]);

  return (
    <JsonApiContext.Provider value={memoizedConfig}>
      {children}
    </JsonApiContext.Provider>
  );
}
