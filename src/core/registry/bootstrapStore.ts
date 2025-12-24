/**
 * Centralized bootstrap store accessible from ModuleRegistry.
 * This file has NO external dependencies to avoid circular imports.
 *
 * The bootstrap store allows ModuleRegistry to call the app's bootstrapper
 * when modules are accessed before bootstrap() was called, providing
 * self-healing behavior for module evaluation order issues.
 *
 * IMPORTANT: We use globalThis to persist state across HMR/Turbopack
 * module re-evaluations in development mode. Without this, the bootstrapper
 * reference would be lost when modules are hot-reloaded, causing
 * "Module not registered" errors during navigation.
 */

type BootstrapperFn = () => void;

// Symbol key to avoid conflicts with other globals
const BOOTSTRAP_KEY = Symbol.for("nextjs-jsonapi:bootstrapper");
const BOOTSTRAP_ATTEMPTED_KEY = Symbol.for("nextjs-jsonapi:bootstrapAttempted");

// Use globalThis to persist across HMR reloads
const globalStore = globalThis as unknown as {
  [BOOTSTRAP_KEY]?: BootstrapperFn | null;
  [BOOTSTRAP_ATTEMPTED_KEY]?: boolean;
};

// Initialize from global if not set
if (globalStore[BOOTSTRAP_KEY] === undefined) {
  globalStore[BOOTSTRAP_KEY] = null;
}
if (globalStore[BOOTSTRAP_ATTEMPTED_KEY] === undefined) {
  globalStore[BOOTSTRAP_ATTEMPTED_KEY] = false;
}

// Getters/setters that use the global store
function getBootstrapperInternal(): BootstrapperFn | null {
  return globalStore[BOOTSTRAP_KEY] ?? null;
}

function setBootstrapperInternal(fn: BootstrapperFn | null): void {
  globalStore[BOOTSTRAP_KEY] = fn;
}

function getBootstrapAttempted(): boolean {
  return globalStore[BOOTSTRAP_ATTEMPTED_KEY] ?? false;
}

function setBootstrapAttempted(value: boolean): void {
  globalStore[BOOTSTRAP_ATTEMPTED_KEY] = value;
}

/**
 * Register the bootstrapper function.
 * Called by configureJsonApi() from client/config, client/JsonApiClient, or unified/JsonApiRequest.
 */
export function setBootstrapper(fn: BootstrapperFn): void {
  setBootstrapperInternal(fn);
}

/**
 * Get the registered bootstrapper function.
 * Returns null if no bootstrapper has been registered.
 */
export function getBootstrapper(): BootstrapperFn | null {
  return getBootstrapperInternal();
}

/**
 * Attempt to run the bootstrapper if one is registered.
 * Returns true if bootstrapper was executed, false if not available.
 * Safe to call multiple times - bootstrapper is expected to be idempotent.
 */
export function tryBootstrap(): boolean {
  const bootstrapper = getBootstrapperInternal();
  const attempted = getBootstrapAttempted();

  if (attempted && !bootstrapper) {
    // Already tried and no bootstrapper available
    return false;
  }
  setBootstrapAttempted(true);

  if (bootstrapper) {
    bootstrapper();
    return true;
  }
  return false;
}

/**
 * Check if a bootstrapper has been registered.
 */
export function hasBootstrapper(): boolean {
  return getBootstrapperInternal() !== null;
}

/**
 * Reset the bootstrap store. Useful for testing.
 */
export function resetBootstrapStore(): void {
  setBootstrapperInternal(null);
  setBootstrapAttempted(false);
}
