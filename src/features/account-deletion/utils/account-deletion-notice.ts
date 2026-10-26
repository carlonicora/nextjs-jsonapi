/**
 * One-shot flag between the login that cancelled a pending account deletion and
 * the first page after it, which shows AccountDeletionCancelledNotice. Kept in
 * sessionStorage so it survives the redirect (and the full reload of the
 * Discord / Google path) but not the tab. Storage can be missing or throw
 * (private mode, blocked site data): the notice is then simply not shown.
 */
export const ACCOUNT_DELETION_CANCELLED_KEY = "nja:accountDeletionCancelled";

export function markAccountDeletionCancelled(): void {
  try {
    sessionStorage.setItem(ACCOUNT_DELETION_CANCELLED_KEY, "1");
  } catch {
    // Storage unavailable: no notice.
  }
}

export function consumeAccountDeletionCancelled(): boolean {
  try {
    const value = sessionStorage.getItem(ACCOUNT_DELETION_CANCELLED_KEY);
    if (value === null) return false;
    sessionStorage.removeItem(ACCOUNT_DELETION_CANCELLED_KEY);
    return true;
  } catch {
    return false;
  }
}
