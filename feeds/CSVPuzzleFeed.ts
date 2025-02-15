import { createReadStream } from "fs";
import { PuzzleFeed } from "./PuzzleFeed";
import { createInterface } from "readline";
import { Puzzle, PuzzleDataFields, PuzzleFieldCount } from "../types/Puzzle";
import { COLORS, log } from "../utils/logs";

export class CSVPuzzleFeed implements PuzzleFeed {
  private rl: AsyncIterator<string>;
  private lineNum: number = 0;
  
  constructor(csvFilePath: string) {
    const stream = createReadStream(csvFilePath);
    const rlInterface = createInterface({
      input: stream,
      crlfDelay: Infinity,
    });
    this.rl = rlInterface[Symbol.asyncIterator]();
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

    const puzzle: Puzzle = {} as Puzzle;
    PuzzleDataFields.forEach((field, index) => {
      puzzle[field] = values[index];
    });
    return puzzle;
  }
}