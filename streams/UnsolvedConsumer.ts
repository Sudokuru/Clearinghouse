import { createClient, RedisClientType } from "redis";
import { connectToRedis, QUIT_REDIS_MSG } from "../utils/redis";
import { log } from "../utils/logs";
import { NEW_SOLVED_SET, UNSOLVED_CONSUMER_GROUP, UNSOLVED_STREAM } from "./StreamConstants";
import { PuzzleKey, SudokuruPuzzleData } from "../types/Puzzle";
import { getPuzzleData } from "sudokuru";
import { attempt } from "../utils/helpers";

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
const client: RedisClientType = createClient();

try {
  await connectToRedis(client);
} catch (error) {
  logf(`Failed to connect to Redis: ${error.message}`, true);
  process.exit(1);
}

logf("Consumer thread " + CONSUMER_THREAD + " is starting to consume unsolved puzzles...");

async function processPuzzle(puzzle: string) {
  const alreadySolved = await client.exists(new PuzzleKey(puzzle, true).toString());
  if (alreadySolved) {
    //logf(`This puzzle is already solved: ${puzzle}`);
    return;
  }

  const data = attempt(() => getPuzzleData(puzzle));
  if (!data.ok) {
    //logf(`Sudokuru package threw an error trying to solve this puzzle: ${puzzle}`);
    // TODO: insert puzzle into failed stream (DLQ)
    return;
  }

  const sudokuruData: SudokuruPuzzleData = data.result as unknown as SudokuruPuzzleData;
  //logf(`puzzle solution is ${sudokuruData.solution}`);

  const solvedFields = {
    solution: sudokuruData.solution,
    difficulty: sudokuruData.difficulty,
    obvious_single_drill: sudokuruData.drills[0],
    hidden_single_drill: sudokuruData.drills[1],
    obvious_pair_drill: sudokuruData.drills[2],
    hidden_pair_drill: sudokuruData.drills[3],
    pointing_pair_drill: sudokuruData.drills[4],
    obvious_triplet_drill: sudokuruData.drills[5],
    hidden_triplet_drill: sudokuruData.drills[6],
    pointing_triplet_drill: sudokuruData.drills[7],
    obvious_quadruplet_drill: sudokuruData.drills[8],
    hidden_quadruplet_drill: sudokuruData.drills[9]
  };

  // Insert solved key
  await client.hSet(new PuzzleKey(puzzle, true).toString(), solvedFields);

  // Insert new solved key
  // These are read these in start.ts after consumers finish and appended to solved puzzles csv
  await client.sAdd(NEW_SOLVED_SET, puzzle);
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
      if (Date.now() >= CUTOFF_TIME) break;
      await processPuzzle(messageObj.message.puzzleKey);
      //logf(`Processed puzzle ${messageObj.message.puzzleKey}`);
      await client.xAck(UNSOLVED_STREAM, UNSOLVED_CONSUMER_GROUP, messageObj.id);
    }
  }
}

await client.quit();
logf(QUIT_REDIS_MSG);