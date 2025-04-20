import { RedisClientType } from "redis";
import { assertOutputContains } from "../utils/testing";

export async function testIngestDrills(redisClient: RedisClientType): Promise<void> {
  const timeLimit: string = "5";
  const threads: string = "2";
  const maxDrillsPerStrategy: string = "2";
  const solvedPuzzleFile: string = "puzzles.csv";
  const solvedDrillFile: string = "drills.csv";
  
  const ingestDrillsRun = Bun.spawn({
    cmd: ["sh", "-c", "echo 'y' | bun ingest_drills.ts"],
    env: {
      ...process.env, // preserve env
      GENERATE_TIME_LIMIT: timeLimit,
      GENERATE_THREADS: threads,
      MAX_DRILLS_PER_STRATEGY: maxDrillsPerStrategy,
      SOLVED_PUZZLE_FILE: solvedPuzzleFile,
      SOLVED_DRILL_FILE: solvedDrillFile,
    },
    stdout: "pipe",
  });
  await ingestDrillsRun.exited;
  const ingestDrillsOutput: string = await new Response(ingestDrillsRun.stdout as ReadableStream<Uint8Array>).text();
  
  const expectedConfigOutput: string[] = [
    `Generate Time Limit: ${timeLimit}`,
    `Generate Threads: ${threads}`,
    `Max Drills Per Strategy: ${maxDrillsPerStrategy}`,
    `Solved Puzzle File: ${solvedPuzzleFile}`,
    `Solved Drill File: ${solvedDrillFile}`,
    //'Are these values correct? (y/n):'
  ]
  
  await assertOutputContains(ingestDrillsOutput, expectedConfigOutput, "ingest_drills.ts config", redisClient);
  // await assertOutputContains(ingestPuzzlesOutput, [SUCCESS_CONNECT_MSG, QUIT_REDIS_MSG], "ingest_drills.ts redis connection", redisClient);
}