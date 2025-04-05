import { createClient } from "redis";
import { COLORS, log } from "./utils/logs";
import { connectToRedis, getPuzzleDataFromRedis, QUIT_REDIS_MSG, startRedis } from "./utils/redis";
import { CSVPuzzleFeed } from "./feeds/CSVPuzzleFeed";
import { Puzzle, PuzzleData, PuzzleDataFields, PuzzleKey } from "./types/Puzzle";
import { TxtPuzzleFeed } from "./feeds/TxtPuzzleFeed";
import { DEFAULT_SOLVED_PUZZLES_FILE, NEW_SOLVED_SET, UNSOLVED_CONSUMER_GROUP, UNSOLVED_STREAM } from "./streams/StreamConstants";
import { Subprocess } from "bun";


// Assign environment variables to variables with fallback defaults.
const BASE: number = 10;
const generateTimeLimit: number = parseInt(process.env.GENERATE_TIME_LIMIT ?? "60", BASE);
const generateThreads: number = parseInt(process.env.GENERATE_THREADS ?? "1", BASE);
const unsolvedPuzzleFile: string = process.env.UNSOLVED_PUZZLE_FILE ?? "puzzles1.txt";
const solvedPuzzleFile: string = process.env.SOLVED_PUZZLE_FILE ?? DEFAULT_SOLVED_PUZZLES_FILE;

// Log config values
log("Configuration Values:");
log(`Generate Time Limit: ${generateTimeLimit}`);
log(`Generate Threads: ${generateThreads}`);
log(`Unsolved Puzzle File: ${unsolvedPuzzleFile}`);
log(`Solved Puzzle File: ${solvedPuzzleFile}`);

// Prompt the user to confirm the configuration.
const answer = prompt("\nAre these values correct? (y/n): ");

// If the answer is not 'y' (ignoring case), exit the process.
if (answer?.toLowerCase() !== "y") {
  log("Configuration not confirmed. Exiting...", COLORS.RED);
  process.exit(1);
}

// Start the Redis Docker Container
const started = await startRedis();
if (!started) {
  process.exit(1);
}

// Create Redis Client
const client = createClient();

await connectToRedis(client);

// Ingest presolved solved puzzles into Redis
const solved: CSVPuzzleFeed = new CSVPuzzleFeed("data/solved/" + solvedPuzzleFile);
let puzzle: Puzzle | null;
while ((puzzle = await solved.next()) !== null) {
  await client.hSet(puzzle.key.toString(), puzzle.data);
}

// TODO: Get current number of solved puzzles in Redis

// TODO: Delete dead letter queue of failed to solve puzzles if it exists in Redis

// Delete unsolved puzzles stream
await client.del(UNSOLVED_STREAM);

// Create Redis Consumer Group to read from Stream
await client.xGroupCreate(UNSOLVED_STREAM, UNSOLVED_CONSUMER_GROUP, "$", { MKSTREAM: true });

// Read puzzles from file onto Redis Stream
const unsolved: TxtPuzzleFeed = new TxtPuzzleFeed("data/unsolved/" + unsolvedPuzzleFile);
while ((puzzle = await unsolved.next()) !== null) {
  await client.xAdd(UNSOLVED_STREAM, "*", {
    puzzleKey: puzzle.key.toString()
  });
}

// Get current number of entries on unsolved stream
const totalToSolve: number = await client.xLen(UNSOLVED_STREAM);

// Delete old consumer log files before generating new ones
const clearLogs = Bun.spawn({
  cmd: ["bash", "-c", "rm -f streams/logs/*.log"],
  stdout: "pipe",
});
await clearLogs.exited;

// Run GENERATE_THREADS number of consumers each reading from Stream
const cutoffTime = Date.now() + (generateTimeLimit * 1000);
const processes: Subprocess<"ignore", "pipe", "inherit">[] = [];
for (let i: number = 0; i < generateThreads; i++) {
  processes.push(Bun.spawn({
    cmd: ["bun", "streams/UnsolvedConsumer.ts"],
    env: {
      ...process.env, // preserve env so have bun in $PATH
      CONSUMER_THREAD: i.toString(),
      CUTOFF_TIME:  cutoffTime.toString(),
    },
    stdout: "pipe",
  }));
}

log("Solving puzzles...");
for (const proc of processes) {
  await proc.exited;
}
log("Finished solving puzzles.", COLORS.GREEN);

await client.del(UNSOLVED_STREAM);

// Pop newly solved puzzles off Redis set and append them to solved puzzles csv file
let puzzleStrArr: string[];
while ((puzzleStrArr = await client.sPop(NEW_SOLVED_SET)).length !== 0) {
  const puzzleData = await getPuzzleDataFromRedis(client, puzzleStrArr[0]);
  if (puzzleData === null) {
    continue;
  }
  const puzzleDataCSV = PuzzleDataFields.map((key) => puzzleData[key]).join(",");
  // TODO: append csv string to csv file
}

await client.quit();
log(QUIT_REDIS_MSG, COLORS.GREEN);

// TODO: Get final number of solved puzzles in Redis

// TODO: Get number of failed to solve puzzles in Redis

// TODO: Display to user:
// number of newly solved puzzles
// total number of solved puzzles
// total number of puzzles failed to solve
// total number of puzzles ran out of time to solve

// TODO: change default puzzle file to None in which case just load presolved and skip unsolved logic for quit start