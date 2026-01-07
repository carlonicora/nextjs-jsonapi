import { atom } from "jotai";
import { atomFamily } from "jotai-family";
import { OAuthClientInterface } from "../interfaces/oauth.interface";

// ==========================================
// OAUTH CLIENTS STATE
// ==========================================

/**
 * Primary store for OAuth clients
 * Populated by useOAuthClients hook
 */
export const oauthClientsAtom = atom<OAuthClientInterface[]>([]);

/**
 * Loading state for OAuth clients list
 */
export const oauthClientsLoadingAtom = atom<boolean>(false);

/**
 * Error state for OAuth client operations
 */
export const oauthClientsErrorAtom = atom<Error | null>(null);

/**
 * Derived atom family for getting a single client by ID
 * Usage: const client = useAtomValue(oauthClientByIdAtom(clientId))
 *
 * @param clientId - The client ID (not the internal id, but the clientId field)
 * @returns The client if found, undefined otherwise
 */
export const oauthClientByIdAtom = atomFamily((clientId: string) =>
  atom((get) => {
    const clients = get(oauthClientsAtom);
    return clients.find((c) => c.clientId === clientId || c.id === clientId);
  }),
);

// ==========================================
// ONE-TIME SECRET DISPLAY STATE
// ==========================================

/**
 * Stores the client secret for one-time display
 * Set after createClient or regenerateSecret, cleared after user acknowledges
 */
export const oauthNewClientSecretAtom = atom<string | null>(null);

/**
 * The client ID associated with the new secret
 * Used to know which client the secret belongs to
 */
export const oauthNewClientIdAtom = atom<string | null>(null);

// ==========================================
// CONSENT FLOW STATE
// ==========================================

/**
 * Loading state for consent screen data fetch
 */
export const oauthConsentLoadingAtom = atom<boolean>(false);

/**
 * Error state for consent flow
 */
export const oauthConsentErrorAtom = atom<Error | null>(null);

// ==========================================
// WRITE ATOMS (for actions)
// ==========================================

/**
 * Write atom to set a new client secret and associated client ID
 */
export const setNewClientSecretAtom = atom(null, (get, set, value: { clientId: string; secret: string } | null) => {
  if (value === null) {
    set(oauthNewClientSecretAtom, null);
    set(oauthNewClientIdAtom, null);
  } else {
    set(oauthNewClientSecretAtom, value.secret);
    set(oauthNewClientIdAtom, value.clientId);
  }
});

/**
 * Write atom to clear the new client secret (after user acknowledges)
 */
export const clearNewClientSecretAtom = atom(null, (get, set) => {
  set(oauthNewClientSecretAtom, null);
  set(oauthNewClientIdAtom, null);
});

/**
 * Write atom to update the clients list
 */
export const setOAuthClientsAtom = atom(null, (get, set, clients: OAuthClientInterface[]) => {
  set(oauthClientsAtom, clients);
});

/**
 * Write atom to add a client to the list
 */
export const addOAuthClientAtom = atom(null, (get, set, client: OAuthClientInterface) => {
  const clients = get(oauthClientsAtom);
  set(oauthClientsAtom, [...clients, client]);
});

/**
 * Write atom to update a client in the list
 */
export const updateOAuthClientAtom = atom(null, (get, set, updatedClient: OAuthClientInterface) => {
  const clients = get(oauthClientsAtom);
  const index = clients.findIndex((c) => c.id === updatedClient.id || c.clientId === updatedClient.clientId);
  if (index !== -1) {
    const newClients = [...clients];
    newClients[index] = updatedClient;
    set(oauthClientsAtom, newClients);
  }
});

/**
 * Write atom to remove a client from the list
 */
export const removeOAuthClientAtom = atom(null, (get, set, clientId: string) => {
  const clients = get(oauthClientsAtom);
  set(
    oauthClientsAtom,
    clients.filter((c) => c.id !== clientId && c.clientId !== clientId),
  );
});
