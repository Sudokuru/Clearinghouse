/**
 * Executes a function safely, returning either a success result or an error.
 */
export function attempt<T>(fn: () => T): { ok: true; result: T } | { ok: false; error: Error } {
  try {
    return { ok: true, result: fn() };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
