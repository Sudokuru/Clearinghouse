import { createClient } from "redis";
import { COLORS, log } from "./utils/logs";
import { connectToRedis, startRedis } from "./utils/redis";
import { CSVPuzzleFeed } from "./feeds/CSVPuzzleFeed";
import { Puzzle } from "./types/Puzzle";
import { TxtPuzzleFeed } from "./feeds/TxtPuzzleFeed";
import { UNSOLVED_CONSUMER_GROUP, UNSOLVED_STREAM } from "./streams/UnsolvedConsumer";


// Assign environment variables to variables with fallback defaults.
const BASE: number = 10;
const generateTimeLimit: number = parseInt(process.env.GENERATE_TIME_LIMIT ?? "60", BASE);
const generateThreads: number = parseInt(process.env.GENERATE_THREADS ?? "1", BASE);
const puzzleFile: string = process.env.PUZZLE_FILE ?? "puzzles1.txt";

// Log config values
log("Configuration Values:");
log(`Generate Time Limit: ${generateTimeLimit}`);
log(`Generate Threads: ${generateThreads}`);
log(`Puzzle File: ${puzzleFile}`);

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

connectToRedis(client);

// Ingest presolved solved puzzles into Redis
const solved: CSVPuzzleFeed = new CSVPuzzleFeed("data/solved/puzzles.csv");
let puzzle: Puzzle | null;
while ((puzzle = await solved.next()) !== null) {
  await client.hSet(puzzle.key, puzzle.data);
}

// TODO: Get current number of solved puzzles in Redis

// TODO: Delete dead letter queue of failed to solve puzzles if it exists in Redis

// Delete unsolved puzzles stream
await client.del(UNSOLVED_STREAM);

// Read puzzles from file onto Redis Stream
const unsolved: TxtPuzzleFeed = new TxtPuzzleFeed("data/unsolved/" + puzzleFile);
while ((puzzle = await unsolved.next()) !== null) {
  await client.xAdd(UNSOLVED_STREAM, "*", {
    puzzleKey: puzzle.key
  });
}

// TODO: Get current number of pending messages on Stream

// Create Redis Consumer Group to read from Stream
await client.xGroupCreate(UNSOLVED_STREAM, UNSOLVED_CONSUMER_GROUP, "$", { MKSTREAM: true });

// TODO: Run GENERATE_THREADS number of consumers each reading from Stream:

await client.quit();
log("Redis connection closed. Exiting.", COLORS.GREEN);

// TODO: display progress bar every second by number of remaining pending messages

// TODO: When consumers all finish delete messages from Stream

// TODO: Get final number of solved puzzles in Redis

// TODO: Get number of failed to solve puzzles in Redis

// TODO: Display to user:
// number of newly solved puzzles
// total number of solved puzzles
// total number of puzzles failed to solve

// TODO: change default puzzle file to None in which case just load presolved and skip unsolved logic for quit start