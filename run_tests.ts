import { createClient, RedisClientType } from "redis";
import { COLORS, log } from "./utils/logs";
import { CLEAR_REDIS_MSG, clearRedis, connectToRedis, QUIT_REDIS_MSG, startRedis, stopRedis, SUCCESS_CONNECT_MSG } from "./utils/redis";
import { assertOutputContains, cleanup } from "./utils/testing";
import { testIngestPuzzles } from "./tests/test_ingest_puzzles";

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

await testIngestPuzzles(client);

// TODO: Run ingest_puzzles.ts and verify saying n/N exits early

// TODO: As converting export and difficulty report scripts run and test them here too

// Cleanup
await cleanup(client);

log("✅ Tests passed successfully!", COLORS.GREEN);