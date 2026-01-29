import { getDrillPuzzleString } from "sudokuru";
import { CSVDrillFeed } from "./feeds/CSVDrillFeed";
import { CSVPuzzleFeed } from "./feeds/CSVPuzzleFeed";
import { DEFAULT_SOLVED_DRILLS_FILE, DEFAULT_SOLVED_PUZZLES_FILE, SOLVED_DATA_DIR } from "./streams/StreamConstants";
import { Drill } from "./types/Drill";
import { addDrill, DrillSet } from "./types/DrillSet";
import { DrillFields, Puzzle } from "./types/Puzzle";
import { promptUserToConfirmValues } from "./utils/logs";
import { WriteStream } from "fs";
import { getWriteStream } from "./utils/helpers";

// Assign environment variables to variables with fallback defaults.
const BASE: number = 10;
const maxDrillsPerStrategyEnv = process.env.MAX_DRILLS_PER_STRATEGY ?? "5000";
const maxDrillsPerStrategy = Number.parseInt(maxDrillsPerStrategyEnv, BASE);
if (Number.isNaN(maxDrillsPerStrategy) || maxDrillsPerStrategy < 0) {
  console.error(`Invalid MAX_DRILLS_PER_STRATEGY: '${maxDrillsPerStrategyEnv}'`);
  process.exit(1);
}
const solvedDrillFile: string = process.env.SOLVED_DRILL_FILE ?? DEFAULT_SOLVED_DRILLS_FILE;
const solvedPuzzleFile: string | null = process.env.SOLVED_PUZZLE_FILE ?? DEFAULT_SOLVED_PUZZLES_FILE;

const config = {
  "Max Drills Per Strategy": maxDrillsPerStrategy,
  "Solved Puzzle File": solvedPuzzleFile,
  "Solved Drill File": solvedDrillFile
}

// Prompt user to confirm configured values else exits early
promptUserToConfirmValues(config);

// Ingest presolved drills
const set: DrillSet = {
  drills: [],
  seenDrill: new Set<string>(),
  drillCounts: new Map<string, number>()
};
const solved: CSVDrillFeed = new CSVDrillFeed(SOLVED_DATA_DIR + solvedDrillFile);
let drill: Drill | null;
while ((drill = await solved.next()) !== null) {
  addDrill(set, drill);
}
solved.close();

// Ingest drills from solved puzzles until hitting max per strategy
// Write new drills to solved drill file as they are solved
const puzzles: CSVPuzzleFeed = new CSVPuzzleFeed(SOLVED_DATA_DIR + solvedPuzzleFile);
let puzzle: Puzzle | null;
const solvedDrillFileStream: WriteStream = await getWriteStream(SOLVED_DATA_DIR + solvedDrillFile);
while ((puzzle = await puzzles.next()) !== null) {
  for (const field of DrillFields) {
    if (puzzle.data[field] !== -1) {
      if ((set.drillCounts.get(field) ?? 0) < maxDrillsPerStrategy) {
        const drillPuzzleString = getDrillPuzzleString(puzzle.key.getPuzzle(), puzzle.data[field]);
        const drillIsNew: boolean = addDrill(set, {
          strategy: field,
          initialPuzzle: puzzle.key.getPuzzle(),
          drillPuzzle: drillPuzzleString
        });
        if (drillIsNew) {
          solvedDrillFileStream.write(
            field + "," + puzzle.key.getPuzzle() + "," + drillPuzzleString + "\n"
          );
        }
      }
    }
  }
}
puzzles.close();
solvedDrillFileStream.close();
