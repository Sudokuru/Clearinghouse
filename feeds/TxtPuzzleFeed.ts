import { Puzzle, PuzzleData, PuzzleKey } from "../types/Puzzle";
import { getIterator, PuzzleFeed } from "./PuzzleFeed";

export class TxtPuzzleFeed implements PuzzleFeed {
  private iterator: AsyncIterator<string>;
  private closeStream: () => void;

  constructor(txtFilePath: string) {
    const { iterator, close } = getIterator(txtFilePath);
    this.iterator = iterator;
    this.closeStream = close;
  }

  async next(): Promise<Puzzle | null> {
    while (true) {
      const data = await this.iterator.next();
      if (data.done) {
        this.close();
        return null;
      }
    
      const line = data.value.trim();
      if (!line) {
        // Skip empty lines
        continue;
      }
    
      // Create and return a properly initialized Puzzle object
      return {
        key: new PuzzleKey(line, false),
        data: {} as PuzzleData
      };
    }
  }

  async close() {
    this.closeStream();
  }
}