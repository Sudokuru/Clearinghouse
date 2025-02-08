import { COLORS, log } from "./utils/logs";
import { startRedis } from "./utils/redis";

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

startRedis();

// TODO: Create Redis Client

// TODO: Ingest presolved solved puzzles into Redis

// TODO: Get current number of solved puzzles in Redis

// TODO: Delete dead letter queue of failed to solve puzzles if it exists in Redis

// TODO: Read puzzles from file onto Redis Stream

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