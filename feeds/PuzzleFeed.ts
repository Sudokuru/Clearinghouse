import { createReadStream } from "fs";
import { Puzzle } from "../types/Puzzle";
import { createInterface } from "readline";

export interface PuzzleFeed {
  /**
   * Returns the next Puzzle in the feed or null if the feed is exhausted.
   */
  next(): Promise<Puzzle | null>;
}

export function getIterator(filePath: string): AsyncIterator<string> {
  const stream = createReadStream(filePath);
  const rlInterface = createInterface({
    input: stream,
    crlfDelay: Infinity,
  });
  return rlInterface[Symbol.asyncIterator]();
}