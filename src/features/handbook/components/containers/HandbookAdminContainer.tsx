"use client";

import HandbookContents from "../lists/HandbookContents";

/**
 * The administration route's entry point for the manual.
 *
 * `RoundPageContainer` moved down into `HandbookContents`, which is the only
 * component that can supply it: the container's title bar reads its heading
 * from `useSharedContext()`, so `HandbookProvider` has to wrap it, and the
 * provider's `functions` (the ask launcher, Sincronizza and the status line)
 * are built from the state `HandbookContents` holds. `HandbookAskContainer`
 * composes its own surface the same way.
 */
export default function HandbookAdminContainer() {
  return <HandbookContents />;
}
