import { Drill } from "../types/Drill";

export interface DrillFeed {
  /**
   * Returns the next Drill in the feed or null if the feed is exhausted.
   */
  next(): Promise<Drill | null>;

  /**
   * Closes the feed and releases any resources.
   */
  close(): void;
}
