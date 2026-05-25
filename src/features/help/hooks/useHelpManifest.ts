"use client";
import { useHelp } from "../contexts/HelpContext";
export function useHelpManifest() {
  return useHelp().manifest;
}
