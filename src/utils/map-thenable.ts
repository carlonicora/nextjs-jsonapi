/**
 * Derives a native Promise from a thenable.
 *
 * A promise passed from a Server Component to a Client Component arrives as
 * React's deserialised chunk. It inherits from Promise.prototype, but its
 * `then()` only registers callbacks and returns undefined, so
 * `session.then(fn)` yields undefined and `Promise.resolve(session)` hands the
 * same chunk back. Wrapping it in `new Promise` adopts it and gives a real
 * promise to chain, store in context or pass to `use()`.
 */
export function mapThenable<T, R>(thenable: PromiseLike<T>, map: (value: T) => R): Promise<R> {
  return new Promise<R>((resolve, reject) => {
    thenable.then((value) => resolve(map(value)), reject);
  });
}
