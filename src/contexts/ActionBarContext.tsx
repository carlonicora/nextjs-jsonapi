"use client";

import { createContext, ReactNode, useContext } from "react";

/**
 * True while rendering inside the page action bar (`title.actionBar`, drawn by
 * RoundPageContainerTitle).
 *
 * The action bar is a full-width row of page-level commands, so its buttons
 * carry a visible label — "Edit", "Delete" — instead of the bare glyph the same
 * components use in a table row or a sheet header, where horizontal space is
 * scarce. Commands read the flag through `useIsInActionBar()` rather than
 * taking a prop, so an app only has to populate `title.actionBar`: everything
 * it puts there labels itself, and nothing has to be threaded through the
 * app's own wrapper components.
 */
const ActionBarContext = createContext<boolean>(false);

export const ActionBarProvider = ({ value, children }: { value: boolean; children: ReactNode }) => (
  <ActionBarContext.Provider value={value}>{children}</ActionBarContext.Provider>
);

export const useIsInActionBar = (): boolean => useContext(ActionBarContext);
