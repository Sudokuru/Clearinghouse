import { startRedis } from "./utils/redis";

// Start the Redis Docker Container
const started = await startRedis();
if (!started) {
  process.exit(1);
}

// Clear Redis Database
const clearDbRun = Bun.spawn({
  cmd: ["bun", "clear.ts"],
  stdout: "inherit",
  stderr: "inherit",
});


// TODO: Capture clearDbRun output and verify it is successful

// TODO: Add env var to use different solved puzzles csv to start.ts
// TODO: Create test solved puzzles csv
// TODO: Create unsolved test txt

// TODO: Run start.ts and verify all outputs and Redis contents

// TODO: Run start.ts and verify saying n/N exits early

// TODO: Create GitHub Pipeline PR/Merge Job to run this test file

// TODO: As add functionality to start.ts, UnsolvedConsumer.ts add to this test

// TODO: As converting export and difficulty report scripts run and test them here too