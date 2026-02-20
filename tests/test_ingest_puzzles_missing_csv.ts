import { RedisClientType } from "redis";
import { SOLVED_DATA_DIR } from "../streams/StreamConstants";
import { QUIT_REDIS_MSG, SUCCESS_CONNECT_MSG } from "../utils/redis";
import { assertOutputContains, cleanupAndExit } from "../utils/testing";

export async function testIngestPuzzlesMissingCsv(redisClient: RedisClientType): Promise<void> {
  const timeLimit = "5";
  const threads = "1";
  const solvedPuzzleFile = "testMissingPuzzles.csv";
  const solvedPuzzlePath = SOLVED_DATA_DIR + solvedPuzzleFile;

  await Bun.spawn({ cmd: ["rm", "-f", solvedPuzzlePath] }).exited;

  const env = {
    ...process.env,
    GENERATE_TIME_LIMIT: timeLimit,
    GENERATE_THREADS: threads,
    SOLVED_PUZZLE_FILE: solvedPuzzleFile,
  };
  delete env.UNSOLVED_PUZZLE_FILE;

  const ingestPuzzlesRun = Bun.spawn({
    cmd: ["sh", "-c", "echo 'y' | bun ingest_puzzles.ts"],
    env,
    stdout: "pipe",
  });
  const exitCode = await ingestPuzzlesRun.exited;
  const ingestPuzzlesOutput: string = await new Response(ingestPuzzlesRun.stdout as ReadableStream<Uint8Array>).text();
  if (exitCode !== 0) {
    const err = ingestPuzzlesRun.stderr ? await new Response(ingestPuzzlesRun.stderr as ReadableStream<Uint8Array>).text() : "";
    await cleanupAndExit(`ingest_puzzles.ts exited with code ${exitCode}\n${err}`, redisClient);
  }

  const expectedConfigOutput: string[] = [
    `Generate Time Limit: ${timeLimit}`,
    `Generate Threads: ${threads}`,
    "Unsolved Puzzle File: null",
    `Solved Puzzle File: ${solvedPuzzleFile}`,
    "Are these values correct? (y/n):",
  ];
  await assertOutputContains(ingestPuzzlesOutput, expectedConfigOutput, "ingest_puzzles.ts missing csv config", redisClient);
  await assertOutputContains(ingestPuzzlesOutput, [SUCCESS_CONNECT_MSG, QUIT_REDIS_MSG], "ingest_puzzles.ts missing csv redis", redisClient);

  console.log("Test Ingest Puzzles Missing CSV Logs:\n" + ingestPuzzlesOutput + "\n");
}
