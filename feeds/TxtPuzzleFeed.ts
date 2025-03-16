import { Puzzle, PuzzleData, PuzzleKey } from "../types/Puzzle";
import { getIterator, PuzzleFeed } from "./PuzzleFeed";

export class TxtPuzzleFeed implements PuzzleFeed {
  private rl: AsyncIterator<string>;

  constructor(txtFilePath: string) {
    this.rl = getIterator(txtFilePath);
  }

  async next(): Promise<Puzzle | null> {
    const data = await this.rl.next();
    if (data.done) {
        return null;
    }

    const line = data.value.trim();
    if (!line) {
      // Skip empty lines by recursively calling next().
      return this.next();
    }

    return {
        key: new PuzzleKey(line, false),
        data: {} as PuzzleData
    } as Puzzle;
  }
}