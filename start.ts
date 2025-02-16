import { createClient } from "redis";
import { COLORS, log } from "./utils/logs";
import { connectToRedis, startRedis } from "./utils/redis";
import { CSVPuzzleFeed } from "./feeds/CSVPuzzleFeed";
import { Puzzle } from "./types/Puzzle";
import { TxtPuzzleFeed } from "./feeds/TxtPuzzleFeed";

// Constants
const UNSOLVED_STREAM: string = "unsolved";

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

await client.quit();
log("Redis connection closed. Exiting.", COLORS.GREEN);


// TODO: Create Redis Consumer Group to read from Stream

// TODO: Get current number of pending messages on Stream

// TODO: Run GENERATE_THREADS number of consumers each reading from Stream:
//  If solved:
//    If solved key does not already exist in Redis:
//      Insert solved key
//      Insert newSolved key
//  Else if not solved:
//    Insert failed key if one does not already exist
//  Acknoledge message 

// TODO: display progress bar every second by number of remaining pending messages

// TODO: When consumers all finish delete messages from Stream

// TODO: Get final number of solved puzzles in Redis

// TODO: Get number of failed to solve puzzles in Redis

// TODO: Display to user:
// number of newly solved puzzles
// total number of solved puzzles
// total number of puzzles failed to solve