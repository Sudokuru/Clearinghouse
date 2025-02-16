import { createClient } from "redis";
import { connectToRedis } from "../utils/redis";
import { log } from "../utils/logs";

// Constants
const CONSUMER_THREAD: string = process.env.CONSUMER_THREAD ?? "X";

// Create Redis Client
const client = createClient();

connectToRedis(client);

log("Consumer thread " + CONSUMER_THREAD + " is starting to consume unsolved puzzles...");