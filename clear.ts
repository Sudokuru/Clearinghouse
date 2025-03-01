import { createClient } from "redis";
import { connectToRedis } from "./utils/redis";
import { COLORS, log } from "./utils/logs";

// Create Redis Client
const client = createClient();

await connectToRedis(client);

// Clear the currently selected database (which is all Clearinghouse uses)
await client.flushDb();
log("🧹 Cleared the Redis Database 🗑️", COLORS.GREEN);

await client.quit();
log("Redis connection closed. Exiting.", COLORS.GREEN);