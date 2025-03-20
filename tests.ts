import { createClient } from "redis";
import { COLORS, log } from "./utils/logs";
import { CLEAR_REDIS_MSG, clearRedis, connectToRedis, QUIT_REDIS_MSG, startRedis, SUCCESS_CONNECT_MSG } from "./utils/redis";
import { assertOutputContains, getPuzzleDataFromRedis } from "./utils/testing";

// Start the Redis Docker Container
const started = await startRedis();
if (!started) {
  process.exit(1);
}

// Clear Redis Database
const clearDbRun = await clearRedis();

const clearOutput: string = await new Response(clearDbRun.stdout as ReadableStream<Uint8Array>).text();

await assertOutputContains(clearOutput, [SUCCESS_CONNECT_MSG, CLEAR_REDIS_MSG, QUIT_REDIS_MSG], "clear.ts");

const timeLimit: string = "5"; // TODO: may need to raise this if not enough for consumers to go through > 1 batch
const threads: string = "2";
const solvedPuzzleFile: string = "tests.csv";

const startRun = Bun.spawn({
  cmd: ["sh", "-c", "echo 'y' | bun start.ts"],
  env: {
    ...process.env, // preserve env
    GENERATE_TIME_LIMIT: timeLimit,
    GENERATE_THREADS: threads,
    SOLVED_PUZZLE_FILE: solvedPuzzleFile,
  },
  stdout: "pipe",
});
await startRun.exited;
const startOutput: string = await new Response(startRun.stdout as ReadableStream<Uint8Array>).text();

const expectedConfigOutput: string[] = [
  `Generate Time Limit: ${timeLimit}`,
  `Generate Threads: ${threads}`,
  'Unsolved Puzzle File: puzzles1.txt',
  `Solved Puzzle File: ${solvedPuzzleFile}`,
  'Are these values correct? (y/n):'
]

await assertOutputContains(startOutput, expectedConfigOutput, "start.ts config");
await assertOutputContains(startOutput, [SUCCESS_CONNECT_MSG, QUIT_REDIS_MSG], "start.ts redis connection");

// Create Redis Client
const client = createClient();

try {
  connectToRedis(client);
} catch {
  await clearRedis();
  log("❌ Failed to connect to Redis");
}

// Verify presolved puzzle is in Redis
const presolvedExpectedString: string = JSON.stringify({
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
});
// TODO: make helper for the following assertion:
const presolvedActualData = await getPuzzleDataFromRedis(client, "007500023850004060030102590700200010000710835080040076300620751915837042276000000");
if (presolvedActualData === null) {
  log("❌ Failed to get presolved puzzle out of Redis after running start.ts");
  await clearRedis();
  await client.quit();
  process.exit(1);
}
const presolvedActualString: string = JSON.stringify(presolvedActualData);
if (presolvedExpectedString !== presolvedActualString) {
  log("❌ Presolved puzzle data from Redis did not match what was expected.");
  log(`Expected: ${presolvedExpectedString}`);
  log(`Actual: ${presolvedActualString}`);
  await clearRedis();
  await client.quit();
  process.exit(1);
}


console.log("Temp logging this to make tests: `" + startOutput + "`");

// TODO: Verify all outputs and Redis contents from startRun
// TODO: Once start.ts is ready add test to make sure that tests.csv contains a solved puzzle
// with correct values as well as not having overwritten existing one and not duplicated
// then spawn `git checkout data/solved/tests.csv` cmd

// TODO: Run start.ts and verify saying n/N exits early

// TODO: Create GitHub Pipeline PR/Merge Job to run this test file and pass if final log outputted or just exit code == 0

// TODO: As add functionality to start.ts, UnsolvedConsumer.ts add to this test

// TODO: As converting export and difficulty report scripts run and test them here too

// Cleanup
await clearRedis();
await client.quit();

log("✅ Tests passed successfully!", COLORS.GREEN);