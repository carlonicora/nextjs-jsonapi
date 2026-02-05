/**
 * Token parameters for authentication cookie management
 */
export interface TokenParams {
  token?: string;
  refreshToken?: string;
  userId?: string;
  companyId?: string;
  roles?: string[];
  features?: string[];
  modules?: {
    id: string;
    permissions: {
      create: boolean | string;
      read: boolean | string;
      update: boolean | string;
      delete: boolean | string;
    };
  }[];
}

/**
 * Token handler interface for dependency injection
 * Apps must provide implementations of these functions via configureAuth()
 */
export interface TokenHandler {
  updateToken: (params: TokenParams) => Promise<void>;
  removeToken: () => Promise<void>;
}

// Private storage for the injected token handler
let _tokenHandler: TokenHandler | null = null;

/**
 * Configure authentication token handling
 * Call this at app startup to provide Server Actions for cookie management
 *
 * @example
 * ```typescript
 * import { configureAuth } from "@carlonicora/nextjs-jsonapi";
 * import { updateToken, removeToken } from "@/features/auth/utils/AuthCookies";
 *
 * configureAuth({ updateToken, removeToken });
 * ```
 */
export function configureAuth(handler: TokenHandler): void {
  _tokenHandler = handler;
}

/**
 * Internal getter for AuthService to access the token handler
 * @internal
 */
export function getTokenHandler(): TokenHandler | null {
  return _tokenHandler;
}
