import { createClient, RedisClientType } from "redis";
import { COLORS, formatEta, log, logProgressTwoLines } from "./utils/logs";
import { batchLoadPuzzles, connectToRedis, getPuzzleDataFromRedis, QUIT_REDIS_MSG, startRedis } from "./utils/redis";
import { CSVPuzzleFeed } from "./feeds/CSVPuzzleFeed";
import { PuzzleDataFields } from "./types/Puzzle";
import { TxtPuzzleFeed } from "./feeds/TxtPuzzleFeed";
import { ALREADY_SOLVED_SET, DEFAULT_SOLVED_PUZZLES_FILE, NEW_SOLVED_SET, FAILED_SOLVE_SET, UNSOLVED_CONSUMER_GROUP, UNSOLVED_STREAM } from "./streams/StreamConstants";
import { Subprocess } from "bun";
import { createWriteStream } from "fs";
const fs = require("fs");


// Assign environment variables to variables with fallback defaults.
const BASE: number = 10;
const generateTimeLimit: number = parseInt(process.env.GENERATE_TIME_LIMIT ?? "60", BASE);
const generateThreads: number = parseInt(process.env.GENERATE_THREADS ?? "1", BASE);
const redisStreamBatchSize: number = parseInt(process.env.REDIS_STREAM_BATCH_SIZE ?? "500", BASE);
const unsolvedPuzzleFile: string | null = process.env.UNSOLVED_PUZZLE_FILE ?? null;
const solvedPuzzleFile: string = process.env.SOLVED_PUZZLE_FILE ?? DEFAULT_SOLVED_PUZZLES_FILE;

// Log config values
log("Configuration Values:");
log(`Generate Time Limit: ${generateTimeLimit}`);
log(`Generate Threads: ${generateThreads}`);
log(`Redis Stream Batch Size: ${redisStreamBatchSize}`);
log(`Unsolved Puzzle File: ${unsolvedPuzzleFile}`);
log(`Solved Puzzle File: ${solvedPuzzleFile}`);

// Prompt the user to confirm the configuration.
const answer = prompt("\nAre these values correct? (y/n): ");

// If the answer is not 'y' (ignoring case), exit the process.
if (answer?.toLowerCase() !== "y") {
  log("Configuration not confirmed. Exiting...", COLORS.RED);
  process.exit(1);
}

// We add unsolvedPuzzles to a Redis stream - which does not deduplicate entries.
// Therefore, we need to deduplicate the unsolved puzzles file before adding it to the stream.
async function deduplicateFile(filePath: string): Promise<number> {
  // Read the entire file into memory
  const fileContent = await fs.promises.readFile(filePath, "utf-8");

  // Split lines, deduplicate using a Set, and join them back
  const lines = fileContent.split("\n").map((line: string) => line.trim());
  const uniqueLines = Array.from(new Set(lines));

  // Write the deduplicated content back to the file
  await fs.promises.writeFile(filePath, uniqueLines.join("\n"), "utf-8");

  // Return the number of duplicates removed
  return lines.length - uniqueLines.length;
}

const duplicatesRemoved = await deduplicateFile(`data/unsolved/${unsolvedPuzzleFile}`);
log(duplicatesRemoved > 0 ? `Removed ${duplicatesRemoved} duplicate puzzles from ${unsolvedPuzzleFile} file.` : `No duplicate puzzles found in ${unsolvedPuzzleFile} file.`,
  duplicatesRemoved > 0 ? COLORS.RED : COLORS.GREEN
);

// Start the Redis Docker Container
const started = await startRedis();
if (!started) {
  process.exit(1);
}

// Create Redis Client
const client: RedisClientType = createClient();

await connectToRedis(client);

log(`Loading solved puzzles from ${solvedPuzzleFile} into Redis database...`, COLORS.YELLOW);

const solvedFeed = new CSVPuzzleFeed("data/solved/" + solvedPuzzleFile);
await batchLoadPuzzles(
  solvedFeed,
  (pipeline, puzzle) => pipeline.hSet(puzzle.key.toString(), puzzle.data),
  redisStreamBatchSize,
  "Loaded {count} solved puzzles into Redis database...",
  "Successfully loaded {count} solved puzzles from the file into Redis database.",
  client
);

// Exit early if user opted not to solve a new puzzle file
if (unsolvedPuzzleFile === null) {
  await client.quit();
  log(QUIT_REDIS_MSG, COLORS.GREEN);
  process.exit(0);
}

// Clear tracking sets from previous run
await client.multi()  
  .del(NEW_SOLVED_SET)  
  .del(ALREADY_SOLVED_SET)  
  .del(FAILED_SOLVE_SET)  
  .exec();

// Delete unsolved puzzles stream
await client.del(UNSOLVED_STREAM);

// Create Redis Consumer Group to read from Stream
await client.xGroupCreate(UNSOLVED_STREAM, UNSOLVED_CONSUMER_GROUP, "$", { MKSTREAM: true });

// Read puzzles from file onto Redis Stream if unsolved puzzle file passed in
const unsolvedFeed = new TxtPuzzleFeed("data/unsolved/" + unsolvedPuzzleFile);

// Load unsolved puzzles onto Redis Stream
log(`Loading unsolved puzzles from ${unsolvedPuzzleFile} onto Redis Stream...`, COLORS.YELLOW);

const puzzleCount = await batchLoadPuzzles(
  unsolvedFeed,
  (pipeline, puzzle) => pipeline.xAdd(UNSOLVED_STREAM, "*", { puzzleKey: puzzle.key.toString() }),
  redisStreamBatchSize,
  "Loaded {count} unsolved puzzles onto Redis Stream...",
  "Successfully loaded {count} unsolved puzzles onto Redis Stream.",
  client
);

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

const startTime = Date.now();

log(`Start Time: ${new Date(startTime).toLocaleString()}`, COLORS.CYAN);
log(`Timeout Time: ${new Date(cutoffTime).toLocaleString()}`, COLORS.CYAN);


// Helper to read pending + lag for the consumer group
async function getGroupMetrics(): Promise<{ pending: number; lag: number }> {
  const raw = await client.sendCommand(['XINFO', 'GROUPS', UNSOLVED_STREAM]) as any[];
  // raw is an array of flat arrays; take the first group
  const g = Array.isArray(raw) && raw.length > 0 ? raw[0] : [];
  const getNum = (key: string): number => {
    const idx = g.indexOf(key);
    return idx >= 0 ? Number(g[idx + 1]) || 0 : 0;
  };
  return {
    pending: getNum('pending'),
    lag: getNum('lag'),
  };
}

const progressInterval = setInterval(async () => {
  try {
    const aliveThreads = processes.filter((p) => p.exitCode === null).length;

    const { pending, lag } = await getGroupMetrics();
    const remaining = Math.max(0, pending + lag);
    const processed = Math.max(0, totalToSolve - remaining);
    const percentage = totalToSolve === 0
      ? "100.00"
      : ((processed / totalToSolve) * 100).toFixed(2);

    const newSolved = await client.sCard(NEW_SOLVED_SET);
    const alreadySolved = await client.sCard(ALREADY_SOLVED_SET);
    const failedSolve = await client.sCard(FAILED_SOLVE_SET);
    const remainingToSolve = puzzleCount - (newSolved + alreadySolved + failedSolve);

    const elapsedSecs = (Date.now() - startTime) / 1000;
    const rate = processed > 0 && elapsedSecs > 0 ? processed / elapsedSecs : 0;
    const etaSecs = rate > 0 ? remaining / rate : 0;
    const eta = rate > 0 ? formatEta(etaSecs) : "estimating...";

    logProgressTwoLines(
      `Progress: ${processed}/${totalToSolve} (${percentage}%) | ETA ${eta} | Threads: ${aliveThreads}/${processes.length}`,
      `Stats - New: ${newSolved} | Already: ${alreadySolved} | Failed: ${failedSolve} | Remaining: ${remainingToSolve}/${puzzleCount}`,
      COLORS.CYAN
    );
  } catch {
    // ignore transient errors
  }
}, 5000);

// Wait for workers to finish
for (const proc of processes) {
  await proc.exited;
}

// Final progress line
clearInterval(progressInterval);

// Get final counts from tracking sets
const finalNewSolved = await client.sCard(NEW_SOLVED_SET);
const finalAlreadySolved = await client.sCard(ALREADY_SOLVED_SET);
const finalFailedSolve = await client.sCard(FAILED_SOLVE_SET);

// Calculate remaining (timed out)
const finalProcessed = finalNewSolved + finalAlreadySolved + finalFailedSolve;
const finalTimedOut = puzzleCount - finalProcessed;
const finalTotal = puzzleCount;

const endTime = Date.now();
const totalElapsed = ((endTime - startTime) / 1000 / 60).toFixed(2); // minutes

console.log()
log(
  `Final: New: ${finalNewSolved} | Already: ${finalAlreadySolved} | Failed: ${finalFailedSolve} | Timed Out: ${finalTimedOut} | Total: ${finalTotal}`,
  finalTimedOut ? COLORS.RED : COLORS.GREEN
)

log(
  finalTimedOut ? `Clearinghouse timed out. Processed ${finalProcessed} puzzles out of ${puzzleCount}.` : `Clearinghouse completed. Processed ${finalProcessed} puzzles out of ${puzzleCount}.`,
  finalTimedOut ? COLORS.RED : COLORS.GREEN
)

log(`End Time: ${new Date(endTime).toLocaleString()}`, COLORS.CYAN);
log(`Total Time: ${totalElapsed} minutes`, COLORS.CYAN);

await client.del(UNSOLVED_STREAM);

// Open solved puzzles csv file in append mode
const solvedPuzzleFileStream = createWriteStream("data/solved/" + solvedPuzzleFile, { flags: "a" });

// Pop newly solved puzzles off Redis set and append them to solved puzzles csv file
let puzzleStrArr: string[];
while ((puzzleStrArr = await client.sPop(NEW_SOLVED_SET)) !== null && puzzleStrArr.length !== 0) {
  const puzzleStr: string = puzzleStrArr.toString();
  const puzzleData = await getPuzzleDataFromRedis(client, puzzleStr);
  if (puzzleData === null) {
    continue;
  }
  const puzzleDataCSV = PuzzleDataFields.map((key) => puzzleData[key]).join(",");
  solvedPuzzleFileStream.write(puzzleStr + "," + puzzleDataCSV + "\n");
}

solvedPuzzleFileStream.end();

await client.quit();
log(QUIT_REDIS_MSG, COLORS.GREEN);

// File path for the solved puzzles CSV
const solvedPuzzleFilePath = "data/solved/" + solvedPuzzleFile;

// Read the entire CSV file
const puzzles = fs.readFileSync(solvedPuzzleFilePath, "utf-8")
  .trim()
  .split("\n")
  .map((line: string) => {
    const [puzzleStr, solution, ...rest] = line.split(",");
    return { puzzleStr, solution, rest };
  });

// Sort the puzzles by the solution string
puzzles.sort((a: { puzzleStr: string; solution: string; rest: string[] }, b: { puzzleStr: string; solution: string; rest: string[] }) => 
  a.solution.localeCompare(b.solution)
);

// Write the sorted puzzles back to the file
const sortedContent = puzzles
  .map(({ puzzleStr, solution, rest }: { puzzleStr: string; solution: string; rest: string[] }) => 
    [puzzleStr, solution, ...rest].join(",")
  )
  .join("\n");

fs.writeFileSync(solvedPuzzleFilePath, sortedContent, "utf-8");

log(`Puzzles in ${solvedPuzzleFilePath} have been sorted by solution.`, COLORS.GREEN);