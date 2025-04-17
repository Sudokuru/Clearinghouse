import { stopRedis } from "./utils/redis";
import { log, COLORS } from "./utils/logs";

await stopRedis();
const success = await stopRedis();
if (!success) {
  log("Failed to stop Redis container", COLORS.RED);
  process.exit(1);
}