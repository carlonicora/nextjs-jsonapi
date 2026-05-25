"use client";
import { createContext, useContext, ReactNode } from "react";
import { _getStaticHelpContent } from "../../../core/registry/helpStore";
import type { HelpContentConfig } from "../interfaces/help-content-config.interface";

const HelpContext = createContext<HelpContentConfig | null>(null);

export function HelpProvider({ children }: { children: ReactNode }) {
  const cfg = _getStaticHelpContent<HelpContentConfig>();
  if (!cfg) {
    throw new Error(
      "Help content not configured — call configureJsonApi({ helpContent: {...} }) before importing help components.",
    );
  }
  return <HelpContext.Provider value={cfg}>{children}</HelpContext.Provider>;
}

export function useHelp(): HelpContentConfig {
  const ctx = useContext(HelpContext);
  if (!ctx) {
    throw new Error("useHelp() called outside <HelpProvider>. Wrap your help route group with <HelpProvider>.");
  }
  return ctx;
}
