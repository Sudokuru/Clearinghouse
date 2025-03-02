import { createClient } from "redis";
import { CLEAR_REDIS_MSG, connectToRedis, QUIT_REDIS_MSG } from "./utils/redis";
import { COLORS, log } from "./utils/logs";

// Create Redis Client
const client = createClient();

await connectToRedis(client);

// Clear the currently selected database (which is all Clearinghouse uses)
await client.flushDb();
log(CLEAR_REDIS_MSG, COLORS.GREEN);

await client.quit();
log(QUIT_REDIS_MSG, COLORS.GREEN);