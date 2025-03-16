import { getIterator, PuzzleFeed } from "./PuzzleFeed";
import { Puzzle, PuzzleData, PuzzleDataFields, PuzzleFieldCount, PuzzleKey } from "../types/Puzzle";
import { COLORS, log } from "../utils/logs";

export class CSVPuzzleFeed implements PuzzleFeed {
  private rl: AsyncIterator<string>;
  private lineNum: number = 0;
  
  constructor(csvFilePath: string) {
    this.rl = getIterator(csvFilePath);
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
    if (values.length < PuzzleFieldCount) {
      log(`Line ${this.lineNum} has fewer fields than expected.`, COLORS.RED);
      return this.next();
    }

    const puzzle: Puzzle = {
      key: new PuzzleKey(values[0], true),
      data: {} as PuzzleData,
    };

    PuzzleDataFields.forEach((field, index) => {
      // Use index + 1 because values[0] is already used for the key.
      puzzle.data[field] = values[index + 1];
    });
    return puzzle;
  }
}