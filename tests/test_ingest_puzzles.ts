import { RedisClientType } from "redis";
import { assertOutputContains, assertRedisContainsPuzzleData, assertStringInArrayExactlyOnce } from "../utils/testing";
import { QUIT_REDIS_MSG, SUCCESS_CONNECT_MSG } from "../utils/redis";
import { Puzzle, PuzzleData } from "../types/Puzzle";
import { CSVPuzzleFeed } from "../feeds/CSVPuzzleFeed";

export async function testIngestPuzzles(redisClient: RedisClientType): Promise<void> {
  const timeLimit: string = "5";
  const threads: string = "2";
  const unsolvedPuzzleFile: string = "puzzles1.txt";
  const solvedPuzzleFile: string = "testPuzzles.csv";
  
  const ingestPuzzlesRun = Bun.spawn({
    cmd: ["sh", "-c", "echo 'y' | bun ingest_puzzles.ts"],
    env: {
      ...process.env, // preserve env
      GENERATE_TIME_LIMIT: timeLimit,
      GENERATE_THREADS: threads,
      UNSOLVED_PUZZLE_FILE: unsolvedPuzzleFile,
      SOLVED_PUZZLE_FILE: solvedPuzzleFile,
    },
    stdout: "pipe",
  });
  await ingestPuzzlesRun.exited;
  const ingestPuzzlesOutput: string = await new Response(ingestPuzzlesRun.stdout as ReadableStream<Uint8Array>).text();
  
  const expectedConfigOutput: string[] = [
    `Generate Time Limit: ${timeLimit}`,
    `Generate Threads: ${threads}`,
    `Unsolved Puzzle File: ${unsolvedPuzzleFile}`,
    `Solved Puzzle File: ${solvedPuzzleFile}`,
    'Are these values correct? (y/n):'
  ]
  
  await assertOutputContains(ingestPuzzlesOutput, expectedConfigOutput, "ingest_puzzles.ts config", redisClient);
  await assertOutputContains(ingestPuzzlesOutput, [SUCCESS_CONNECT_MSG, QUIT_REDIS_MSG], "ingest_puzzles.ts redis connection", redisClient);
  
  // Verify presolved puzzle is in Redis
  const presolvedPuzzleData: PuzzleData = {
    solution: "197568423852394167634172598763285914429716835581943276348629751915837642276451389",
    difficulty: -15174,
    obvious_single_drill: 80,
    hidden_single_drill: -1,
    obvious_pair_drill: 62,
    hidden_pair_drill: 52,
    pointing_pair_drill: -1,
    obvious_triplet_drill: -1,
    hidden_triplet_drill: -1,
    pointing_triplet_drill: -1,
    obvious_quadruplet_drill: 57,
    hidden_quadruplet_drill: 48
  };
  const presolvedPuzzleDataString = JSON.stringify(presolvedPuzzleData);
  await assertRedisContainsPuzzleData(redisClient, "007500023850004060030102590700200010000710835080040076300620751915837042276000000", presolvedPuzzleData);
  
  // Verify newly solved puzzle is in Redis
  const newlySolvedPuzzleData: PuzzleData = {
    solution: "567832914329614758148957236756421389934785621281369475892576143673148592415293867",
    difficulty: -15174,
    obvious_single_drill: 80,
    hidden_single_drill: -1,
    obvious_pair_drill: 70,
    hidden_pair_drill: -1,
    pointing_pair_drill: -1,
    obvious_triplet_drill: -1,
    hidden_triplet_drill: -1,
    pointing_triplet_drill: -1,
    obvious_quadruplet_drill: 59,
    hidden_quadruplet_drill: 56
  };
  const newlySolvedPuzzleDataString = JSON.stringify(newlySolvedPuzzleData);
  await assertRedisContainsPuzzleData(redisClient, "007030010329000750148057036000421009930005000001060470892000143073008500010093867", newlySolvedPuzzleData);
  
  // Read puzzles we wrote to testPuzzles.csv
  const solved: CSVPuzzleFeed = new CSVPuzzleFeed("data/solved/testPuzzles.csv");
  const puzzles: Puzzle[] = [];
  let puzzle: Puzzle | null;
  while ((puzzle = await solved.next()) !== null) {
    puzzles.push(puzzle);
  }
  solved.close();
  const puzzleDataStrings: string[] = puzzles.map((p) => JSON.stringify(p.data));

  console.log("Puzzle data ingested during test:");
  console.log(puzzleDataStrings);
  
  // Verify presolved puzzle still in testPuzzles.csv and not duplicated
  await assertStringInArrayExactlyOnce(puzzleDataStrings, presolvedPuzzleDataString, redisClient);
  
  // Verify unsolved puzzle is in testPuzzles.csv file
  await assertStringInArrayExactlyOnce(puzzleDataStrings, newlySolvedPuzzleDataString, redisClient);
  
  console.log("Test Ingest Puzzle Logs:\n" + ingestPuzzlesOutput + "\n");
}