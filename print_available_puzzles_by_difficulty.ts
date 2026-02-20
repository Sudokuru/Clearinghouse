import { CSVPuzzleFeed } from "./feeds/CSVPuzzleFeed";
import { DEFAULT_SOLVED_PUZZLES_FILE, SOLVED_DATA_DIR } from "./streams/StreamConstants";
import { Puzzle } from "./types/Puzzle";
import { DIFFICULTY_RANGES } from "./DifficultyRanges";
import { COLORS, log, promptUserToConfirmValues } from "./utils/logs";

const solvedPuzzleFile: string = process.env.SOLVED_PUZZLE_FILE ?? DEFAULT_SOLVED_PUZZLES_FILE;

const config = {
  "Solved Puzzle File": solvedPuzzleFile,
};
promptUserToConfirmValues(config);

const counts = new Map<string, number>();
for (const range of DIFFICULTY_RANGES) {
  counts.set(range.name, 0);
}

const feed: CSVPuzzleFeed = new CSVPuzzleFeed(SOLVED_DATA_DIR + solvedPuzzleFile);
try {
  let puzzle: Puzzle | null;
  while ((puzzle = await feed.next()) !== null) {
    const difficulty = puzzle.data.difficulty;
    for (const range of DIFFICULTY_RANGES) {
      if (difficulty >= range.minDifficulty && difficulty <= range.maxDifficulty) {
        counts.set(range.name, (counts.get(range.name) ?? 0) + 1);
      }
    }
  }
} finally {
  feed.close();
}

for (const range of DIFFICULTY_RANGES) {
  log(`${range.name}: ${counts.get(range.name) ?? 0}`);
}

const minPuzzles = Math.min(...Array.from(counts.values()));
log(`Minimum puzzles available for any difficulty: ${minPuzzles}`, COLORS.GREEN);
