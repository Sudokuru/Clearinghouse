import { Puzzle } from "../types/Puzzle";

export interface PuzzleFeed {
  /**
   * Returns the next Puzzle in the feed or null if the feed is exhausted.
   */
  next(): Promise<Puzzle | null>;
}