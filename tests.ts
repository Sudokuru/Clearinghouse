import { createClient, RedisClientType } from "redis";
import { COLORS, log } from "./utils/logs";
import { CLEAR_REDIS_MSG, clearRedis, connectToRedis, QUIT_REDIS_MSG, startRedis, stopRedis, SUCCESS_CONNECT_MSG } from "./utils/redis";
import { assertOutputContains, assertRedisContainsPuzzleData, assertStringInArrayExactlyOnce, cleanup } from "./utils/testing";
import { CSVPuzzleFeed } from "./feeds/CSVPuzzleFeed";
import { Puzzle, PuzzleData } from "./types/Puzzle";

// Start the Redis Docker Container
const started = await startRedis();
if (!started) {
  process.exit(1);
}

// Create Redis Client
const client: RedisClientType = createClient();

try {
  await connectToRedis(client);
} catch {
  await clearRedis();
  await stopRedis();
  log("❌ Failed to connect to Redis");
  process.exit(1);
}

// Clear Redis Database
const clearDbRun = await clearRedis();

const clearOutput: string = await new Response(clearDbRun.stdout as ReadableStream<Uint8Array>).text();

await assertOutputContains(clearOutput, [SUCCESS_CONNECT_MSG, CLEAR_REDIS_MSG, QUIT_REDIS_MSG], "clear.ts", client);

const timeLimit: string = "5"; // TODO: may need to raise this if not enough for consumers to go through > 1 batch
const threads: string = "2";
const unsolvedPuzzleFile: string = "puzzles1.txt";
const solvedPuzzleFile: string = "tests.csv";

const ingestPuzzlesRun = Bun.spawn({
  cmd: ["sh", "-c", "echo 'y' | bun ingest_puzzles.ts"],
  env: {
    ...process.env, // preserve env
    GENERATE_TIME_LIMIT: timeLimit,
    GENERATE_THREADS: threads,
    UNSOLVED_PUZZLE_FILE: unsolvedPuzzleFile,
    SOLVED_PUZZLE_FILE: solvedPuzzleFile,
  },
  stdout: "pipe",
});
await ingestPuzzlesRun.exited;
const ingestPuzzlesOutput: string = await new Response(ingestPuzzlesRun.stdout as ReadableStream<Uint8Array>).text();

const expectedConfigOutput: string[] = [
  `Generate Time Limit: ${timeLimit}`,
  `Generate Threads: ${threads}`,
  `Unsolved Puzzle File: ${unsolvedPuzzleFile}`,
  `Solved Puzzle File: ${solvedPuzzleFile}`,
  'Are these values correct? (y/n):'
]

await assertOutputContains(ingestPuzzlesOutput, expectedConfigOutput, "ingest_puzzles.ts config", client);
await assertOutputContains(ingestPuzzlesOutput, [SUCCESS_CONNECT_MSG, QUIT_REDIS_MSG], "ingest_puzzles.ts redis connection", client);

// Verify presolved puzzle is in Redis
const presolvedPuzzleData: PuzzleData = {
  solution: "197568423852394167634172598763285914429716835581943276348629751915837642276451389",
  difficulty: -15174,
  obvious_single_drill: 80,
  hidden_single_drill: 74,
  obvious_pair_drill: -1,
  hidden_pair_drill: -1,
  pointing_pair_drill: 61,
  obvious_triplet_drill: -1,
  hidden_triplet_drill: -1,
  pointing_triplet_drill: -1,
  obvious_quadruplet_drill: -1,
  hidden_quadruplet_drill: -1
};
const presolvedPuzzleDataString = JSON.stringify(presolvedPuzzleData);
await assertRedisContainsPuzzleData(client, "007500023850004060030102590700200010000710835080040076300620751915837042276000000", presolvedPuzzleData);

// Verify newly solved puzzle is in Redis
const newlySolvedPuzzleData: PuzzleData = {
  solution: "567832914329614758148957236756421389934785621281369475892576143673148592415293867",
  difficulty: -15174,
  obvious_single_drill: 80,
  hidden_single_drill: 77,
  obvious_pair_drill: 75,
  hidden_pair_drill: 42,
  pointing_pair_drill: 68,
  obvious_triplet_drill: 69,
  hidden_triplet_drill: 69,
  pointing_triplet_drill: 42,
  obvious_quadruplet_drill: 57,
  hidden_quadruplet_drill: 42
};
const newlySolvedPuzzleDataString = JSON.stringify(newlySolvedPuzzleData);
await assertRedisContainsPuzzleData(client, "007030010329000750148057036000421009930005000001060470892000143073008500010093867", newlySolvedPuzzleData);

// Read puzzles we wrote to tests.csv
const solved: CSVPuzzleFeed = new CSVPuzzleFeed("data/solved/tests.csv");
const puzzles: Puzzle[] = [];
for (let puzzle = await solved.next(); puzzle !== null; puzzle = await solved.next()) {
  puzzles.push(puzzle);
}
const puzzleDataStrings: string[] = puzzles.map((p) => JSON.stringify(p.data));

// Verify presolved puzzle still in tests.csv and not duplicated
await assertStringInArrayExactlyOnce(client, puzzleDataStrings, presolvedPuzzleDataString);

// Verify unsolved puzzle is in tests.csv file
await assertStringInArrayExactlyOnce(client, puzzleDataStrings, newlySolvedPuzzleDataString);

console.log("Temp logging this to make tests: `" + ingestPuzzlesOutput + "`");

// TODO: Run ingest_puzzles.ts and verify saying n/N exits early

// TODO: Create GitHub Pipeline PR/Merge Job to run this test file and pass if final log outputted or just exit code == 0

// TODO: As converting export and difficulty report scripts run and test them here too

// Cleanup
await cleanup(client);

log("✅ Tests passed successfully!", COLORS.GREEN);