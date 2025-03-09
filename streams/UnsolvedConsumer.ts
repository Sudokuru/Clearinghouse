import { createClient } from "redis";
import { connectToRedis, QUIT_REDIS_MSG } from "../utils/redis";
import { log } from "../utils/logs";
import { UNSOLVED_CONSUMER_GROUP, UNSOLVED_STREAM } from "./StreamConstants";

// Constants
const BATCH_SIZE: number = 10;
const CONSUMER_THREAD: string = process.env.CONSUMER_THREAD ?? "";
const CUTOFF_TIME: number = Number(process.env.CUTOFF_TIME);
const LOG_FILE_PREFIX: string = "streams/logs/";
const LOG_FILE_POSTFIX: string = ".log";
const LOG_FILE: string = LOG_FILE_PREFIX + CONSUMER_THREAD + LOG_FILE_POSTFIX;
const ERROR_LOG_FILE: string = LOG_FILE_PREFIX + "error" + LOG_FILE_POSTFIX;

/**
 * Helper function which directs logs to proper consumer log file
 * @param message - message to lod
 * @param error - flag which if passed directs logs to error.log files instead of normal
 * ${consumer number}.log file
 */
function logf(message: string, error?: boolean): void {
  message += '\n';
  if (!error) {
    log(message, undefined, LOG_FILE);
  } else {
    log(message, undefined, ERROR_LOG_FILE);
  }
}

if (!CONSUMER_THREAD) {
  logf("Failed to access consumer thread name.", true);
  process.exit(1);
}

if (Number.isNaN(CUTOFF_TIME)) {
  logf("Failed to access cutoff time.", true);
  process.exit(1);
}

// Create Redis Client
const client = createClient();

connectToRedis(client);

logf("Consumer thread " + CONSUMER_THREAD + " is starting to consume unsolved puzzles...");

async function processPuzzle(puzzle: string) {
  //  If solved:
  //    If solved key does not already exist in Redis:
  //      Insert solved key
  //      Insert newSolved key (can read these in start.ts after consumers finish and append to solved puzzles csv)
  //  Else if not solved:
  //    Insert failed key
}

let unsolved;
while ((unsolved = await client.xReadGroup(
  UNSOLVED_CONSUMER_GROUP,
  CONSUMER_THREAD,
  { key: UNSOLVED_STREAM, id: ">" }, // id ">" reads undelivered messages until no more
  { COUNT: BATCH_SIZE }
))) {
  //logf(JSON.stringify(unsolved, null, 2));
  if (Date.now() >= CUTOFF_TIME) break;
  if (!unsolved || unsolved.length === 0) break; // Exit if no messages
  // Process each puzzle then acknowledge the message

  // Although we are only reading from the single UNSOLVED_STREAM of unsovled puzzles xread
  // is designed to be able to read from multiple streams at once hence the outer loop
  for (const stream of unsolved) {
    //logf(`Starting to process ${stream.name} stream.`);
    for (const messageObj of stream.messages) {
      await processPuzzle(messageObj.message.puzzleKey);
      //logf(`Processed puzzle ${messageObj.message.puzzleKey}`);
      await client.xAck(UNSOLVED_STREAM, UNSOLVED_CONSUMER_GROUP, messageObj.id);
    }
  }
}

await client.quit();
logf(QUIT_REDIS_MSG);