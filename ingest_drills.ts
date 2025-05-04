import { createClient, RedisClientType } from "redis";
import { DEFAULT_SOLVED_DRILLS_FILE } from "./streams/StreamConstants";
import { COLORS, log, promptUserToConfirmValues } from "./utils/logs";
import { connectToRedis, QUIT_REDIS_MSG, startRedis } from "./utils/redis";

// Assign environment variables to variables with fallback defaults.
const BASE: number = 10;
const generateTimeLimit: number = parseInt(process.env.GENERATE_TIME_LIMIT ?? "60", BASE);
const generateThreads: number = parseInt(process.env.GENERATE_THREADS ?? "1", BASE);
const maxDrillsPerStrategy: number = parseInt(process.env.MAX_DRILLS_PER_STRATEGY ?? "5000", BASE);
const solvedDrillFile: string = process.env.SOLVED_DRILL_FILE ?? DEFAULT_SOLVED_DRILLS_FILE;
const solvedPuzzleFile: string | null = process.env.SOLVED_PUZZLE_FILE ?? null;

const config = {
  "Generate Time Limit": generateTimeLimit,
  "Generate Threads": generateThreads,
  "Max Drills Per Strategy": maxDrillsPerStrategy,
  "Solved Puzzle File": solvedPuzzleFile,
  "Solved Drill File": solvedDrillFile
}

// Prompt user to confirm configured values else exits early
promptUserToConfirmValues(config);

// Start the Redis Docker Container
const started = await startRedis();
if (!started) {
  process.exit(1);
}

// Create Redis Client
const client: RedisClientType = createClient();

await connectToRedis(client);

await client.quit();
log(QUIT_REDIS_MSG, COLORS.GREEN);