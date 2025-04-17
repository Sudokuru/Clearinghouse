import { createReadStream } from "fs";
import { Puzzle } from "../types/Puzzle";
import { createInterface } from "readline";

export interface PuzzleFeed {
  /**
   * Returns the next Puzzle in the feed or null if the feed is exhausted.
   */
  next(): Promise<Puzzle | null>;

  /**
   * Closes the feed and releases any resources.
   */
  close(): void;
}

export function getIterator(filePath: string): {
  iterator: AsyncIterator<string>,
  close: () => void
} {
  // Create stream
  const stream = createReadStream(filePath);
  const rlInterface = createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  // Handle potential errors
  stream.on('error', (error) => {
    throw new Error(`Error reading file ${filePath}: ${error.message}`);
  });
  
  return {
    iterator: rlInterface[Symbol.asyncIterator](),
    close: () => {
      rlInterface.close();
      stream.close();
    }
  };
}
