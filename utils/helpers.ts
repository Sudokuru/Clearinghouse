import { createWriteStream, promises as fs, WriteStream } from "fs";

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
 * Returns true if file ends with newline, false otherwise (including if it does not exist)
 */
async function checkIfFileEndsWithoutNewline(filePath: string): Promise<boolean> {
  let needsNewline = false;
  try {
    const stats = await fs.stat(filePath);
    if (stats.size > 0) {
      const handle = await fs.open(filePath, 'r');
      const { buffer } = await handle.read({
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

export async function getWriteStream(filePath: string): Promise<WriteStream> {
  // Check if file exists and whether it ends without a newline
  let needsNewline = await checkIfFileEndsWithoutNewline(filePath);

  // Open file in append mode
  const stream = createWriteStream(filePath, { flags: "a" });

  // If needed, write a leading newline so our first append starts on a new line
  if (needsNewline) {
    stream.write("\n");
  }

  return stream;
}

/**
 * Best practice for fs.WriteStream: don't assume stream.end() means the file is fully written.
 *
 * - stream.end() *signals* no more writes, but the underlying flush/close happens asynchronously.
 * - Wait for the 'finish' event (emitted after end() and after all data is flushed) to avoid
 *   truncated/corrupted files on fast program exits.
 *
 * Docs:
 * - Node.js Streams: 'finish' event: https://nodejs.org/api/stream.html#event-finish
 *
 * References:
 * - StackOverflow: listen for 'finish' after end(): https://stackoverflow.com/questions/27284710/how-to-handle-end-signal-in-a-node-js-writable-stream
 */
export async function closeWriteStreamSafely(stream: WriteStream): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    stream.once("finish", resolve)
    stream.once("error", reject)
    stream.end()
  })
}
