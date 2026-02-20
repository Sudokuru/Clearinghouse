import { DrillFieldCount } from "../types/Drill";
import { Drill } from "../types/Drill";
import { COLORS, log } from "../utils/logs";
import { DrillFeed } from "./DrillFeed";
import { getIterator } from "./Iterator";

export class CSVDrillFeed implements DrillFeed {
  private iterator: AsyncIterator<string>;
  private closeStream: () => void;
  private lineNum: number = 0;

  constructor(csvFilePath: string) {
    const { iterator, close } = getIterator(csvFilePath);
    this.iterator = iterator;
    this.closeStream = close;
  }

  async next(): Promise<Drill | null> {
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
      if (values.length < DrillFieldCount) {
        log(`Line ${this.lineNum} has fewer fields than expected.`, COLORS.RED);
        continue;
      }

      const drill: Drill = {
        strategy: values[0],
        initialPuzzle: values[1],
        drillPuzzle: values[2]
      }

      return drill;
    }
  }

  async close() {
    this.closeStream();
  }
}