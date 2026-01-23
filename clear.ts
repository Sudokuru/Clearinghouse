import { createClient, RedisClientType } from "redis";
import { CLEAR_REDIS_MSG, connectToRedis, QUIT_REDIS_MSG } from "./utils/redis";
import { COLORS, log } from "./utils/logs";

// Create Redis Client
const client: RedisClientType = createClient();

try {
  await connectToRedis(client);
  
  // Clear the currently selected database (which is all Clearinghouse uses)
  await client.flushDb();
  log(CLEAR_REDIS_MSG, COLORS.GREEN);
  
  await client.quit();
  log(QUIT_REDIS_MSG, COLORS.GREEN);
} catch (error) {
  log(`Failed to clear Redis database: ${error.message}`, COLORS.RED);
  // Ensure client is properly closed even if an error occurs
  if (client.isOpen) {
    await client.quit();
  }
  process.exit(1);
}