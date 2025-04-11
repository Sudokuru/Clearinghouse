import { PuzzleData, PuzzleDataSchema, PuzzleKey } from "../types/Puzzle";
import { COLORS, log } from "./logs";
import { clearRedis, getPuzzleDataFromRedis, stopRedis } from "./redis";
import { z } from "zod";

/**
 * Does Redis cleanup 
 */
export async function cleanup(redisClient): Promise<void> {
  await clearRedis();
  await redisClient.quit();
  await stopRedis();
  Bun.spawn({
    cmd: ["git", "checkout", "data/solved/tests.csv"],
    stdout: "inherit",
    stderr: "inherit",
  });
}

/**
 * Does cleanup, logs test failure with given message, and exits early. 
 */
export async function cleanupAndExit(message: string, redisClient): Promise<void> {
  log("❌ Test Failed: " + message, COLORS.RED);
  await cleanup(redisClient);
  process.exit(1);
}

/**
 * Takes in string output, list of substrings that should be contained in output, and test name
 * If a substring is not found in output then test failure is loggged, output is logged,
 * redis is cleared, and test process is exited. Otherwise, clears Redis and exits the program.
 */
export async function assertOutputContains(output: string, contained: string[], name: string, redisClient): Promise<void> {
  for (const substring of contained) {
    if (!output.includes(substring)) {
      log(`Captured logs: ${output}`);
      cleanupAndExit(`${name} expected log message not found in captured logs.`, redisClient);
    }
  }
}

/**
 * Verifies puzzle is contained in Redis with given data else exits
 */
export async function assertRedisContainsPuzzleData(redisClient, puzzle: string, puzzleData) {
  const presolvedActualData = await getPuzzleDataFromRedis(redisClient, puzzle);
  if (presolvedActualData === null) {
    cleanupAndExit("Failed to get presolved puzzle out of Redis after running start.ts", redisClient);
  }
  const presolvedActualString: string = JSON.stringify(presolvedActualData);
  const presolvedExpectedString: string = JSON.stringify(puzzleData);
  if (presolvedExpectedString !== presolvedActualString) {
    log(`Expected: ${presolvedExpectedString}`);
    log(`Actual: ${presolvedActualString}`);
    cleanupAndExit("Presolved puzzle data from Redis did not match what was expected.", redisClient);
  }
}

/**
 * Verifies string occurs exactly once in provided string array
 */
export async function assertStringInArrayExactlyOnce(redisClient, strings: string[], string: string) {
  if (strings.filter(str => str === string).length !== 1) {
    cleanupAndExit(`'${string}' did not occur exactly once in '${strings}'.`, redisClient);
  }
}