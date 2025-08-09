import { CSVPuzzleFeed } from "./feeds/CSVPuzzleFeed";
import { COLORS, log, promptUserToConfirmValues } from "./utils/logs";
import { DEFAULT_SOLVED_PUZZLES_FILE, SOLVED_DATA_DIR } from "./streams/StreamConstants";
import { Puzzle, PuzzleDataFields, PuzzleData, DrillFields } from "./types/Puzzle";

// Assign environment variables to variables with fallback defaults.
const solvedPuzzleFile: string = process.env.SOLVED_PUZZLE_FILE ?? DEFAULT_SOLVED_PUZZLES_FILE;

const config = {
  "Solved Puzzle File": solvedPuzzleFile,
};

// Prompt user to confirm configured values else exits early
promptUserToConfirmValues(config);

// Initialize counts for each drill
const drillCounts: Record<string, number> = Object.fromEntries(
  DrillFields.map((field) => [field, 0])
);

// Read solved puzzle file and count drills
const solved: CSVPuzzleFeed = new CSVPuzzleFeed(SOLVED_DATA_DIR + solvedPuzzleFile);
let puzzle: Puzzle | null;
while ((puzzle = await solved.next()) !== null) {
  for (const field of DrillFields) {
    if (puzzle.data[field] !== -1) {
      drillCounts[field]++;
    }
  }
}

// Output counts per strategy
for (const field of DrillFields) {
  const strategyName = field.replace("_drill", "");
  log(`${strategyName}: ${drillCounts[field]}`);
}

// Compute and output minimum number of drills available for any strategy
const minDrills = Math.min(...Object.values(drillCounts));
log(`Minimum drills available for any strategy: ${minDrills}`, COLORS.GREEN);