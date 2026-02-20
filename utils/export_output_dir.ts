import { mkdir, stat } from "fs/promises";

/**
 * Creates output directory only if it does not already exist.
 * Returns false when the path already exists.
 */
export async function createNewOutputDirectory(outputDir: string): Promise<boolean> {
  try {
    await stat(outputDir);
    return false;
  } catch (err: any) {
    if (err?.code !== "ENOENT") {
      throw err;
    }
    await mkdir(outputDir, { recursive: false });
    return true;
  }
}
