import { createClient, RedisClientType } from "redis";
import { COLORS, log } from "./utils/logs";
import { CLEAR_REDIS_MSG, clearRedis, connectToRedis, QUIT_REDIS_MSG, startRedis, stopRedis, SUCCESS_CONNECT_MSG } from "./utils/redis";
import { assertOutputContains, cleanup } from "./utils/testing";
import { testIngestPuzzles } from "./tests/test_ingest_puzzles";
import { testIngestDrills } from "./tests/test_ingest_drills";
import { testIngestDrillsMissingCsv } from "./tests/test_ingest_drills_missing_csv";
import { testExportDrills } from "./tests/test_export_drills";
import { testExportPuzzles } from "./tests/test_export_puzzles";
import { SOLVED_DATA_DIR } from "./streams/StreamConstants";

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

try {
  const clearDbRun = await clearRedis();
  await clearDbRun.exited;
  const clearOutput: string = await new Response(clearDbRun.stdout as ReadableStream<Uint8Array>).text();
  await assertOutputContains(clearOutput, [SUCCESS_CONNECT_MSG, CLEAR_REDIS_MSG, QUIT_REDIS_MSG], "clear.ts", client);

  // Run the test files
  await testIngestPuzzles(client);
  await Bun.spawn({
    cmd: ["git", "checkout", SOLVED_DATA_DIR + "testPuzzles.csv"],
    stdout: "inherit",
    stderr: "inherit",
  }).exited;
  await testIngestDrills();
  await testIngestDrillsMissingCsv();
  await testExportDrills();
  await testExportPuzzles();

  // TODO: Run ingest_puzzles.ts and verify saying n/N exits early
  // TODO: As converting export and difficulty report scripts run and test them here too

  log("✅ Tests passed successfully!", COLORS.GREEN);
} finally {
  await cleanup(client);
}
