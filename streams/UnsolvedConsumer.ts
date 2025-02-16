import { createClient } from "redis";
import { connectToRedis } from "../utils/redis";
import { COLORS, log } from "../utils/logs";

// Constants
export const UNSOLVED_CONSUMER_GROUP: string = "unsolved:group";
export const UNSOLVED_STREAM: string = "unsolved";
const BATCH_SIZE: number = 10;
const CONSUMER_THREAD: string = process.env.CONSUMER_THREAD ?? "";

if (!CONSUMER_THREAD) {
  log("Failed to access consumer thread name.", COLORS.RED);
  process.exit(1);
}

// Create Redis Client
const client = createClient();

connectToRedis(client);

log("Consumer thread " + CONSUMER_THREAD + " is starting to consume unsolved puzzles...");

let unsolved;
while ((unsolved = await client.xReadGroup(
  UNSOLVED_CONSUMER_GROUP,
  CONSUMER_THREAD,
  { key: UNSOLVED_STREAM, id: ">" },
  { COUNT: BATCH_SIZE }
))) {
  //  If solved:
  //    If solved key does not already exist in Redis:
  //      Insert solved key
  //      Insert newSolved key
  //  Else if not solved:
  //    Insert failed key if one does not already exist
  //  Acknoledge message 
}