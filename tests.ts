import { COLORS, log } from "./utils/logs";
import { CLEAR_REDIS_MSG, clearRedis, QUIT_REDIS_MSG, startRedis, SUCCESS_CONNECT_MSG } from "./utils/redis";

// Start the Redis Docker Container
const started = await startRedis();
if (!started) {
  process.exit(1);
}

// Clear Redis Database
const clearDbRun = await clearRedis();

const clearOutput: string = await new Response(clearDbRun.stdout as ReadableStream<Uint8Array>).text();

if (!clearOutput.includes(SUCCESS_CONNECT_MSG) ||
    !clearOutput.includes(CLEAR_REDIS_MSG) ||
    !clearOutput.includes(QUIT_REDIS_MSG)) {
  log("❌ Clear output test failed: expected log message not found in captured logs.", COLORS.RED);
  log("Captured logs: `" + clearOutput + "`");
  await clearRedis();
  process.exit(1);
}

const timeLimit: string = "5"; // TODO: may need to raise this if not enough for consumers to go through > 1 batch
const threads: string = "2";
const solvedPuzzleFile: string = "tests.csv";

const startRun = Bun.spawn({
  cmd: ["sh", "-c", "echo 'y' | bun start.ts"],
  env: {
    ...process.env, // Preserve existing env vars
    GENERATE_TIME_LIMIT: timeLimit,
    GENERATE_THREADS: threads,
    SOLVED_PUZZLE_FILE: solvedPuzzleFile,
  },
  stdout: "pipe",
});
await startRun.exited;
const startOutput: string = await new Response(startRun.stdout as ReadableStream<Uint8Array>).text();

console.log("Temp logging this to make tests: `" + startOutput + "`");

// TODO: Verify all outputs and Redis contents from startRun

// TODO: Run start.ts and verify saying n/N exits early

// TODO: Create GitHub Pipeline PR/Merge Job to run this test file and pass if final log outputted

// TODO: As add functionality to start.ts, UnsolvedConsumer.ts add to this test

// TODO: As converting export and difficulty report scripts run and test them here too

// Cleanup
await clearRedis();

log("✅ Tests passed successfully!", COLORS.GREEN);