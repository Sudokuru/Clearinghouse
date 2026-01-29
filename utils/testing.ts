import { RedisClientType } from "redis";
import { Puzzle, PuzzleData, PuzzleDataSchema, PuzzleKey } from "../types/Puzzle";
import { COLORS, log } from "./logs";
import { clearRedis, getPuzzleDataFromRedis, stopRedis } from "./redis";
import { z } from "zod";
import { Drill, drillKey } from "../types/Drill";
import { SOLVED_DATA_DIR } from "../streams/StreamConstants";

/**
 * Does Redis cleanup 
 */
export async function cleanup(redisClient: RedisClientType): Promise<void> {
  await clearRedis();
  await redisClient.quit();
  await stopRedis();
  await Bun.spawn({
    cmd: ["git", "checkout", SOLVED_DATA_DIR + "testPuzzles.csv"],
    stdout: "inherit",
    stderr: "inherit",
  }).exited;
  await Bun.spawn({
    cmd: ["git", "checkout", SOLVED_DATA_DIR + "testDrills.csv"],
    stdout: "inherit",
    stderr: "inherit",
  }).exited;
}

/**
 * Does cleanup, logs test failure with given message, and exits early. 
 */
export async function cleanupAndExit(message: string, redisClient?: RedisClientType): Promise<void> {
  if (redisClient) {
    await cleanup(redisClient);
  }
  log("❌ Test Failed: " + message, COLORS.RED);
  process.exit(1);
}

/**
 * Takes in string output, list of substrings that should be contained in output, and test name
 * If a substring is not found in output then test failure is loggged, output is logged,
 * redis is cleared, and test process is exited. Otherwise, clears Redis and exits the program.
 */
export async function assertOutputContains(output: string, contained: string[], name: string, redisClient?: RedisClientType): Promise<void> {
  for (const substring of contained) {
    if (!output.includes(substring)) {
      log(`Captured logs: ${output}`);
      await cleanupAndExit(`${name} expected log message not found in captured logs.`, redisClient);
    }
  }
}

/**
 * Verifies puzzle is contained in Redis with given data else exits
 */
export async function assertRedisContainsPuzzleData(redisClient: RedisClientType, puzzle: string, puzzleData: PuzzleData) {
  const presolvedActualData = await getPuzzleDataFromRedis(redisClient, puzzle);
  if (presolvedActualData === null) {
    await cleanupAndExit("Failed to get presolved puzzle out of Redis after running ingest_puzzles.ts", redisClient);
  }
  // TODO: make PuzzleData comparisons use keys like Drill and Puzzle did for assertDrillInSet and so on below (JSON stringify for deep equality discouraged)
  const presolvedActualString: string = JSON.stringify(presolvedActualData);
  const presolvedExpectedString: string = JSON.stringify(puzzleData);
  if (presolvedExpectedString !== presolvedActualString) {
    log(`Expected: ${presolvedExpectedString}`);
    log(`Actual: ${presolvedActualString}`);
    await cleanupAndExit("Presolved puzzle data from Redis did not match what was expected.", redisClient);
  }
}

/**
 * Verifies the given Drill occurs in provided Drill Set
 * Uses drillKey() for equality.
 */
export async function assertDrillInSet(
  drillKeys: Set<string>,
  drill: Drill,
  redisClient?: RedisClientType
): Promise<void> {
  const key = drillKey(drill)

  if (!drillKeys.has(key)) {
    await cleanupAndExit(`Drill was not found in the set. key=${key}`, redisClient);
  }
}

/**
 * Verifies the given Puzzle occurs in provided Puzzle Set
 * Uses drillKey() for equality.
 */
export async function assertPuzzleInSet(
  puzzleKeys: Set<string>,
  puzzle: string,
  puzzleIsSolved: boolean,
  redisClient?: RedisClientType
): Promise<void> {
  const key = (new PuzzleKey(puzzle, puzzleIsSolved)).toString();

  if (!puzzleKeys.has(key)) {
    await cleanupAndExit(`Puzzle was not found in the set. key=${key}`, redisClient);
  }
}

/**
 * Get number of occurrences of given attribute value in given Drill array
 */
export function getAttributeValueCountInDrills(attribute: keyof Drill, value: string, drills: Drill[]): number {
  return drills.reduce(
    (count, drill) => count + (drill[attribute] == value ? 1 : 0),
    0
  );
}