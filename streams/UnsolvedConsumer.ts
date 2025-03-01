import { createClient } from "redis";
import { connectToRedis } from "../utils/redis";
import { COLORS, log } from "../utils/logs";
import { UNSOLVED_CONSUMER_GROUP, UNSOLVED_STREAM } from "./StreamConstants";

// Constants
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

async function processPuzzle(puzzle: string) {
  //  If solved:
  //    If solved key does not already exist in Redis:
  //      Insert solved key
  //      Insert newSolved key (can read these in start.ts after consumers finish and append to puzzles.csv)
  //  Else if not solved:
  //    Insert failed key
}

let unsolved;
while ((unsolved = await client.xReadGroup(
  UNSOLVED_CONSUMER_GROUP,
  CONSUMER_THREAD,
  { key: UNSOLVED_STREAM, id: ">" },
  { COUNT: BATCH_SIZE }
))) {
  // Process each puzzle then acknowledge the message

  // Although we are only reading from the single UNSOLVED_STREAM of unsovled puzzles xread
  // is designed to be able to read from multiple streams at once hence the outer loop
  for (const [streamKey, messages] of unsolved) {
    for (const [messageId, fieldValues] of messages) {
      // fieldValues is flat array of field/values so should be [puzzleKey, <puzzle.key>, ...]
      for (let i: number = 0; i < fieldValues.length; i += 2) {
        await processPuzzle(fieldValues[i + 1]);
      }
      await client.xAck(UNSOLVED_STREAM, UNSOLVED_CONSUMER_GROUP, messageId);
    }
  }
}