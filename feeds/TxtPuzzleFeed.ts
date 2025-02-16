import { Puzzle, PuzzleData } from "../types/Puzzle";
import { COLORS, log } from "../utils/logs";
import { getIterator, PuzzleFeed } from "./PuzzleFeed";

export class TxtPuzzleFeed implements PuzzleFeed {
  private rl: AsyncIterator<string>;
  private lineNum: number = 0;

  constructor(txtFilePath: string) {
    this.rl = getIterator(txtFilePath);
  }

  async next(): Promise<Puzzle | null> {
    const data = await this.rl.next();
    if (data.done) {
        return null;
    }

    this.lineNum++;
    const line = data.value;
    if (!line.trim()) {
      // Skip empty lines by recursively calling next().
      return this.next();
    }

    const values = line.split(',').map(val => val.trim());
    if (values.length > 1) {
        log(`Line ${this.lineNum} has more fields than expected.`, COLORS.RED);
    }

    return {
        key: 'unsolved:' + values[0],
        data: {} as PuzzleData
    } as Puzzle;
  }
}