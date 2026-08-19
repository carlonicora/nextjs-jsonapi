/**
 * localStorage key backing the `CurrentUserProvider` atom.
 *
 * Owned by this library, not by the apps that consume it: `<Logout />` clears
 * it on every sign-out. Kept in its own module so both the provider that writes
 * it and the component that clears it can reference the same constant without
 * importing each other.
 */
export const CURRENT_USER_STORAGE_KEY = "user";
