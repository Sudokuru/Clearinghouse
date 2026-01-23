import { CSVDrillFeed } from "./feeds/CSVDrillFeed";
import { DEFAULT_SOLVED_DRILLS_FILE, SOLVED_DATA_DIR } from "./streams/StreamConstants";
import { Drill } from "./types/Drill";
import { promptUserToConfirmValues, log } from "./utils/logs";
import { writeFile } from "fs/promises";

// Assign environment variables to variables with fallback defaults.
const solvedDrillFile: string = process.env.SOLVED_DRILL_FILE ?? DEFAULT_SOLVED_DRILLS_FILE;

const config = {
  "Solved Drill File": solvedDrillFile,
};

// Prompt user to confirm configured values else exits early
promptUserToConfirmValues(config);

// Read drills from csv file and group by strategy
const feed: CSVDrillFeed = new CSVDrillFeed(SOLVED_DATA_DIR + solvedDrillFile);
const drillsByStrategy: Map<string, string[]> = new Map();
let drill: Drill | null;
while ((drill = await feed.next()) !== null) {
  const strategyName: string = drill.strategy.replace(/_drill$/, "");
  if (!drillsByStrategy.has(strategyName)) {
    drillsByStrategy.set(strategyName, []);
  }
  drillsByStrategy.get(strategyName)!.push(drill.drillPuzzle);
}

// Write drills to separate ts files per strategy
for (const [strategy, puzzles] of drillsByStrategy.entries()) {
  const arrayName: string = `${strategy}_drills`;
  const fileName: string = `${arrayName}.ts`;
  const content: string = `export const ${arrayName}: string[] = [\n  "${puzzles.join("\",\n  \"")}"\n];\n`;
  await writeFile(fileName, content);
  log(`Wrote ${puzzles.length} drills to ${fileName}`);
}