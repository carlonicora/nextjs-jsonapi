"use client";

import { createContext, use, type ReactNode } from "react";
import type { SessionSnapshot } from "../server/ServerSession";

const SessionContext = createContext<Promise<SessionSnapshot> | null>(null);

export function SessionProvider({ session, children }: { session: Promise<SessionSnapshot>; children: ReactNode }) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

/**
 * Unwraps the session promise with `use()`. Suspends the caller until the
 * promise resolves, so call it only from a leaf behind its own `<Suspense>`.
 */
export function useSession(): SessionSnapshot {
  const session = use(SessionContext);
  if (!session) throw new Error("useSession must be used within a SessionProvider");
  return use(session);
}
