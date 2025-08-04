import { promises as fs } from "fs";

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

/**
 * Returns true if file ends with newline or does not exist, false otherwise
 */
export async function checkIfFileEndsWithoutNewline(filePath: string): Promise<boolean> {
  let needsNewline = false;
  try {
    const stats = await fs.stat(filePath);
    if (stats.size > 0) {
      const handle = await fs.open(filePath, 'r');
      const { buffer } = await handle.read({
        buffer: Buffer.alloc(1),
        position: stats.size - 1,
      });
      await handle.close();
      // if last byte isn't '\n' (0x0A), we'll inject one
      needsNewline = buffer[0] !== 0x0A;
    }
  } catch (err: any) {
    // ignore if file doesn't exist yet; it'll be created below
    if (err.code !== 'ENOENT') throw err;
  }
  return needsNewline;
}