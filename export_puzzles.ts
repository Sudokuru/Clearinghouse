import { CSVPuzzleFeed } from "./feeds/CSVPuzzleFeed";
import { DEFAULT_SOLVED_PUZZLES_FILE, SOLVED_DATA_DIR } from "./streams/StreamConstants";
import { Puzzle } from "./types/Puzzle";
import { promptUserToConfirmValues, log } from "./utils/logs";
import { writeFile } from "fs/promises";

export interface InputPuzzle {
  p: string; // initial puzzle string
  s: string; // solution string
  d: number; // difficulty
}

// Assign environment variables to variables with fallback defaults.
const solvedPuzzleFile: string = process.env.SOLVED_PUZZLE_FILE ?? DEFAULT_SOLVED_PUZZLES_FILE;

const config = {
  "Solved Puzzle File": solvedPuzzleFile,
};

// Prompt user to confirm configured values else exits early
promptUserToConfirmValues(config);

// Read puzzles from csv file
const feed: CSVPuzzleFeed = new CSVPuzzleFeed(SOLVED_DATA_DIR + solvedPuzzleFile);
const puzzles: InputPuzzle[] = [];
let puzzle: Puzzle | null;
try {
  while ((puzzle = await feed.next()) !== null) {
    puzzles.push({
      p: puzzle.key.getPuzzle(),
      s: puzzle.data.solution,
      d: puzzle.data.difficulty,
    });
  }
} finally {
  feed.close();
}

// Write puzzles to ts file
const fileName = "puzzles.ts";
const content: string = `export interface InputPuzzle {
  p: string; // initial puzzle string
  s: string; // solution string
  d: number; // difficulty
}

export const puzzles: InputPuzzle[] = ${JSON.stringify(puzzles, null, 2)};
`;
await writeFile(fileName, content);
log(`Wrote ${puzzles.length} puzzles to ${fileName}`);
