/**
 * Centralized bootstrap store accessible from ModuleRegistry.
 * This file has NO external dependencies to avoid circular imports.
 *
 * The bootstrap store allows ModuleRegistry to call the app's bootstrapper
 * when modules are accessed before bootstrap() was called, providing
 * self-healing behavior for module evaluation order issues.
 */

type BootstrapperFn = () => void;

let _bootstrapper: BootstrapperFn | null = null;
let _bootstrapAttempted = false;

/**
 * Register the bootstrapper function.
 * Called by configureJsonApi() from client/config, client/JsonApiClient, or unified/JsonApiRequest.
 */
export function setBootstrapper(fn: BootstrapperFn): void {
  _bootstrapper = fn;
}

/**
 * Get the registered bootstrapper function.
 * Returns null if no bootstrapper has been registered.
 */
export function getBootstrapper(): BootstrapperFn | null {
  return _bootstrapper;
}

/**
 * Attempt to run the bootstrapper if one is registered.
 * Returns true if bootstrapper was executed, false if not available.
 * Safe to call multiple times - bootstrapper is expected to be idempotent.
 */
export function tryBootstrap(): boolean {
  if (_bootstrapAttempted && !_bootstrapper) {
    // Already tried and no bootstrapper available
    return false;
  }
  _bootstrapAttempted = true;

  if (_bootstrapper) {
    _bootstrapper();
    return true;
  }
  return false;
}

/**
 * Check if a bootstrapper has been registered.
 */
export function hasBootstrapper(): boolean {
  return _bootstrapper !== null;
}

/**
 * Reset the bootstrap store. Useful for testing.
 */
export function resetBootstrapStore(): void {
  _bootstrapper = null;
  _bootstrapAttempted = false;
}
