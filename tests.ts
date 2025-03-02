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

// TODO: Add env var to use different solved puzzles csv to start.ts
// TODO: Create test solved puzzles csv
// TODO: Create unsolved test txt

// TODO: Run start.ts and verify all outputs and Redis contents

// TODO: Run start.ts and verify saying n/N exits early

// TODO: Create GitHub Pipeline PR/Merge Job to run this test file

// TODO: As add functionality to start.ts, UnsolvedConsumer.ts add to this test

// TODO: As converting export and difficulty report scripts run and test them here too

// Cleanup
await clearRedis();