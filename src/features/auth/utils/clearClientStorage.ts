/**
 * Clears specified keys from localStorage during logout.
 * Called before redirect to ensure cleanup happens.
 */
export function clearClientStorage(keys: string[]): void {
  if (typeof window === "undefined") return;

  keys.forEach((key) => {
    window.localStorage.removeItem(key);
  });
}
