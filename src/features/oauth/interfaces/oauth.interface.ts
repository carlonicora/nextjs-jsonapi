import { ApiDataInterface } from "../../../core";

/**
 * OAuth client application interface
 * Represents a registered OAuth application that can request access tokens
 */
export interface OAuthClientInterface extends ApiDataInterface {
  /** The public client identifier (UUID format) */
  get clientId(): string;
  /** Human-readable application name */
  get name(): string;
  /** Optional description of the application */
  get description(): string | undefined;
  /** Array of allowed redirect URIs (exact match validation) */
  get redirectUris(): string[];
  /** Array of scopes this client can request */
  get allowedScopes(): string[];
  /** Supported grant types (authorization_code, client_credentials, refresh_token) */
  get allowedGrantTypes(): string[];
  /** True for server-side apps (can keep secret secure), false for mobile/desktop apps */
  get isConfidential(): boolean;
  /** Whether the client is currently active */
  get isActive(): boolean;
  /** When the client was created */
  get createdAt(): Date;
  /** When the client was last updated */
  get updatedAt(): Date;
}

/**
 * Input type for OAuth client CRUD operations
 */
export type OAuthClientInput = {
  id?: string;
  name?: string;
  description?: string;
  redirectUris?: string[];
  allowedScopes?: string[];
  allowedGrantTypes?: string[];
  isConfidential?: boolean;
  isActive?: boolean;
};

/**
 * Request body for creating a new OAuth client
 */
export interface OAuthClientCreateRequest {
  /** Required: Human-readable application name */
  name: string;
  /** Optional: Description of the application */
  description?: string;
  /** Required: At least one redirect URI */
  redirectUris: string[];
  /** Required: Array of scopes the client needs */
  allowedScopes: string[];
  /** Optional: Grant types (defaults to authorization_code + refresh_token) */
  allowedGrantTypes?: string[];
  /** Required: Whether this is a confidential client */
  isConfidential: boolean;
}

/**
 * Response when creating a client (includes one-time secret)
 */
export interface OAuthClientCreateResponse {
  client: OAuthClientInterface;
  /** Only returned on creation - must be saved immediately */
  clientSecret?: string;
}

/**
 * Parameters for the OAuth authorization consent flow
 * Passed via URL query parameters to the consent page
 */
export interface OAuthConsentRequest {
  /** The client_id requesting authorization */
  clientId: string;
  /** Where to redirect after authorization */
  redirectUri: string;
  /** Space-separated list of requested scopes */
  scope: string;
  /** CSRF protection token (passed back on redirect) */
  state?: string;
  /** PKCE code challenge (required for public clients) */
  codeChallenge?: string;
  /** PKCE method: 'S256' (recommended) or 'plain' */
  codeChallengeMethod?: string;
}

/**
 * Scope information for display in consent screen
 */
export interface OAuthScopeInfo {
  /** The scope identifier (e.g., 'photographs:read') */
  scope: string;
  /** Human-readable scope name */
  name: string;
  /** Description of what this scope allows */
  description: string;
  /** Optional icon identifier */
  icon?: string;
}

/**
 * Client info returned for consent screen display
 */
export interface OAuthConsentInfo {
  client: OAuthClientInterface;
  scopes: OAuthScopeInfo[];
}

/**
 * Default scope display configuration
 * Maps scope identifiers to human-readable info
 */
export const OAUTH_SCOPE_DISPLAY: Record<string, OAuthScopeInfo> = {
  read: {
    scope: "read",
    name: "Read Access",
    description: "Read access to your data",
    icon: "eye",
  },
  write: {
    scope: "write",
    name: "Write Access",
    description: "Write access to your data",
    icon: "pencil",
  },
  "photographs:read": {
    scope: "photographs:read",
    name: "View Photographs",
    description: "Access and download your photo library",
    icon: "image",
  },
  "photographs:write": {
    scope: "photographs:write",
    name: "Upload Photographs",
    description: "Add new photos to your rolls",
    icon: "upload",
  },
  "rolls:read": {
    scope: "rolls:read",
    name: "View Rolls",
    description: "See your film rolls and collections",
    icon: "film",
  },
  "rolls:write": {
    scope: "rolls:write",
    name: "Manage Rolls",
    description: "Create and modify film rolls",
    icon: "folder-plus",
  },
  profile: {
    scope: "profile",
    name: "View Profile",
    description: "Access your name and email",
    icon: "user",
  },
  admin: {
    scope: "admin",
    name: "Administrative Access",
    description: "Full administrative access to your account",
    icon: "shield",
  },
};

/**
 * Available scopes list for the scope selector
 */
export const AVAILABLE_OAUTH_SCOPES: OAuthScopeInfo[] = Object.values(OAUTH_SCOPE_DISPLAY);

/**
 * Default grant types for new clients
 */
export const DEFAULT_GRANT_TYPES = ["authorization_code", "refresh_token"];
