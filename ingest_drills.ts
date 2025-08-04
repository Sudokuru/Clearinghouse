import { getDrillPuzzleString } from "sudokuru";
import { CSVDrillFeed } from "./feeds/CSVDrillFeed";
import { CSVPuzzleFeed } from "./feeds/CSVPuzzleFeed";
import { DEFAULT_SOLVED_DRILLS_FILE } from "./streams/StreamConstants";
import { Drill } from "./types/Drill";
import { addDrill, DrillSet } from "./types/DrillSet";
import { DrillFields, Puzzle } from "./types/Puzzle";
import { promptUserToConfirmValues } from "./utils/logs";

// Assign environment variables to variables with fallback defaults.
const BASE: number = 10;
const generateTimeLimit: number = parseInt(process.env.GENERATE_TIME_LIMIT ?? "60", BASE);
const maxDrillsPerStrategy: number = parseInt(process.env.MAX_DRILLS_PER_STRATEGY ?? "5000", BASE);
const solvedDrillFile: string = process.env.SOLVED_DRILL_FILE ?? DEFAULT_SOLVED_DRILLS_FILE;
const solvedPuzzleFile: string | null = process.env.SOLVED_PUZZLE_FILE ?? null;

const config = {
  "Generate Time Limit": generateTimeLimit,
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
const solved: CSVDrillFeed = new CSVDrillFeed("data/solved/" + solvedDrillFile);
let drill: Drill | null;
while ((drill = await solved.next()) !== null) {
  addDrill(set, drill);
}

// Ingest drills from solved puzzles until hitting max per strategy
const puzzles: CSVPuzzleFeed = new CSVPuzzleFeed("data/solved/" + solvedPuzzleFile);
let puzzle: Puzzle | null;
while ((puzzle = await puzzles.next()) !== null) {
  for (const field of DrillFields) {
    if (puzzle.data[field] !== -1) {
      if ((set.drillCounts.get(field) ?? 0) < maxDrillsPerStrategy) {
        addDrill(set, {
          strategy: field,
          initialPuzzle: puzzle.key.getPuzzle(),
          drillPuzzle: getDrillPuzzleString(puzzle.key.getPuzzle(), puzzle.data[field])
        });
      }
    }
  }
}