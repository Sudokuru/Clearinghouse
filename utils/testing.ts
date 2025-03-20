import { PuzzleData, PuzzleDataSchema, PuzzleKey } from "../types/Puzzle";
import { COLORS, log } from "./logs";
import { clearRedis } from "./redis";
import { z } from "zod";

/**
 * Takes in string output, list of substrings that should be contained in output, and test name
 * If a substring is not found in output then test failure is loggged, output is logged,
 * redis is cleared, and test process is exited. Otherwise, returns void.
 */
export async function assertOutputContains(output: string, contained: string[], name: string): Promise<void> {
  for (const substring of contained) {
    if (!output.includes(substring)) {
      log(`❌ ${name} test failed: expected log message not found in captured logs.`, COLORS.RED);
      log(`Captured logs: ${output}`);
      await clearRedis();
      process.exit(1);
    }
  }
}

/**
 * Returns PuzzleData object with data from solved Redis key if available for given puzzle string
 * Else returns null
 */
export async function getPuzzleDataFromRedis(redisClient, puzzle: string): Promise<PuzzleData | null> {
  const data = await redisClient.hGetAll(new PuzzleKey(puzzle, true).toString());

  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  // Validate and parse data from Redis using zod schema
  const parsed = PuzzleDataSchema.safeParse({
    solution: data.solution,
    difficulty: data.difficulty,
    obvious_single_drill: data.obvious_single_drill,
    hidden_single_drill: data.hidden_single_drill,
    obvious_pair_drill: data.obvious_pair_drill,
    hidden_pair_drill: data.hidden_pair_drill,
    pointing_pair_drill: data.pointing_pair_drill,
    obvious_triplet_drill: data.obvious_triplet_drill,
    hidden_triplet_drill: data.hidden_triplet_drill,
    pointing_triplet_drill: data.pointing_triplet_drill,
    obvious_quadruplet_drill: data.obvious_quadruplet_drill,
    hidden_quadruplet_drill: data.hidden_quadruplet_drill
  });

  if (!parsed.success) {
    log(`❌ failed to parse puzzle data from Redis.`, COLORS.RED);
    return null;
  }

  return parsed.data;
}