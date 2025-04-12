import { getIterator, PuzzleFeed } from "./PuzzleFeed";
import { Puzzle, PuzzleData, PuzzleDataSchema, PuzzleFieldCount, PuzzleKey } from "../types/Puzzle";
import { COLORS, log } from "../utils/logs";

export class CSVPuzzleFeed implements PuzzleFeed {
  private iterator: AsyncIterator<string>;
  private closeStream: () => void;
  private lineNum: number = 0;
  
  constructor(csvFilePath: string) {
    const { iterator, close } = getIterator(csvFilePath);
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
    
      this.lineNum++;
      const line = data.value;
      if (!line.trim()) {
        // Skip empty lines
        continue;
      }
    
      const values = line.split(',').map(val => val.trim());
      if (values.length < PuzzleFieldCount) {
        log(`Line ${this.lineNum} has fewer fields than expected.`, COLORS.RED);
        continue;
      }
    
      const puzzle: Puzzle = {
        key: new PuzzleKey(values[0], true),
        data: {} as PuzzleData,
      };
    
      Object.entries(PuzzleDataSchema.shape).forEach(([fieldName], index) => {
        // Use index + 1 because values[0] is already used for the key.
        puzzle.data[fieldName] = values[index + 1];
      });
      let parsed = PuzzleDataSchema.safeParse(puzzle.data);
      if (!parsed.success) {
        log(`Failed to safely parse the following csv puzzle data: ${puzzle.data}.`, COLORS.RED);
        process.exit(1);
      }
      puzzle.data = parsed.data;

      return puzzle;
    }
  }

  async close() {
    this.closeStream();
  }
}