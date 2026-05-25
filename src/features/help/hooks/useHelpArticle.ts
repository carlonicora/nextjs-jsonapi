"use client";
import { useHelp } from "../contexts/HelpContext";
import { findHelpArticle } from "../utils/helpNavigation";

export function useHelpArticle(mode: string, slug: string) {
  return findHelpArticle(useHelp().manifest, mode, slug);
}
