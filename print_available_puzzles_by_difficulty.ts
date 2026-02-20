import { CSVPuzzleFeed } from "./feeds/CSVPuzzleFeed";
import { DEFAULT_SOLVED_PUZZLES_FILE, SOLVED_DATA_DIR } from "./streams/StreamConstants";
import { Puzzle } from "./types/Puzzle";
import { readDifficultyRanges } from "./utils/difficulty_ranges";
import { COLORS, log, promptUserToConfirmValues } from "./utils/logs";

const solvedPuzzleFile: string = process.env.SOLVED_PUZZLE_FILE ?? DEFAULT_SOLVED_PUZZLES_FILE;
const rangesFile = process.env.DIFFICULTY_RANGES_FILE ?? "DifficultyRanges.md";

const config = {
  "Solved Puzzle File": solvedPuzzleFile,
  "Difficulty Ranges File": rangesFile,
};
promptUserToConfirmValues(config);

const difficultyRanges = await readDifficultyRanges(rangesFile);
if (difficultyRanges.length === 0) {
  console.error(`No difficulty ranges found in ${rangesFile}.`);
  process.exit(1);
}

const counts = new Map<string, number>();
for (const range of difficultyRanges) {
  counts.set(range.name, 0);
}

const feed: CSVPuzzleFeed = new CSVPuzzleFeed(SOLVED_DATA_DIR + solvedPuzzleFile);
try {
  let puzzle: Puzzle | null;
  while ((puzzle = await feed.next()) !== null) {
    const difficulty = puzzle.data.difficulty;
    for (const range of difficultyRanges) {
      if (difficulty >= range.minDifficulty && difficulty <= range.maxDifficulty) {
        counts.set(range.name, (counts.get(range.name) ?? 0) + 1);
      }
    }
  }
} finally {
  feed.close();
}

for (const range of difficultyRanges) {
  log(`${range.name}: ${counts.get(range.name) ?? 0}`);
}

const minPuzzles = Math.min(...Array.from(counts.values()));
log(`Minimum puzzles available for any difficulty: ${minPuzzles}`, COLORS.GREEN);
