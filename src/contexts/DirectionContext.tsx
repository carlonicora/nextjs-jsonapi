"use client";

import * as React from "react";
import { DirectionProvider as BaseUIDirectionProvider } from "@base-ui/react/direction-provider";

export type Direction = "ltr" | "rtl";

const DirectionContext = React.createContext<Direction>("ltr");

/**
 * App-owned direction. The consumer sets <html dir> AND mounts this provider
 * with the same value; the package never derives direction from locale.
 * Wraps Base UI's DirectionProvider so popups resolve align/side logically.
 */
export function DirectionProvider({ dir = "ltr", children }: { dir?: Direction; children: React.ReactNode }) {
  return (
    <DirectionContext.Provider value={dir}>
      <BaseUIDirectionProvider direction={dir}>{children}</BaseUIDirectionProvider>
    </DirectionContext.Provider>
  );
}

export function useDir(): Direction {
  return React.useContext(DirectionContext);
}
