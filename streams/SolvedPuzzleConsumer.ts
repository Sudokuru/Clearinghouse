import { RedisClientType } from "redis";
import { log } from "../utils/logs";
import { createWriteStream } from "fs";
import { NEW_SOLVED_SET } from "./StreamConstants";
import { getPuzzleDataFromRedis } from "../utils/redis";
import { PuzzleDataFields } from "../types/Puzzle";

// Constants
const SOLVED_DIRECTORY: string = "data/solved/";

/**
 * Reads newly solved puzzles from Redis set and appends them to solved puzzle file
 * @param client - Redis client to read set using
 * @param solvedPuzzleFile - file to append solved puzzles to (in SOLVED_DIRECTORY)
 */
export async function consumeSolvedPuzzles(client: RedisClientType, solvedPuzzleFile: string) {
  log("Starting to consume solved puzzles...");

  // Open solved puzzles csv file in append mode
  const solvedPuzzleFileStream = createWriteStream(SOLVED_DIRECTORY + solvedPuzzleFile, { flags: "a" });
  
  // Pop newly solved puzzles off Redis set and append them to solved puzzles csv file
  let puzzleStrArr: string[];
  while ((puzzleStrArr = await client.sPop(NEW_SOLVED_SET)) !== null && puzzleStrArr.length !== 0) {
    const puzzleStr: string = puzzleStrArr.toString();
    const puzzleData = await getPuzzleDataFromRedis(client, puzzleStr);
    if (puzzleData === null) {
      continue;
    }
    const puzzleDataCSV = PuzzleDataFields.map((key) => puzzleData[key]).join(",");
    solvedPuzzleFileStream.write(puzzleStr + "," + puzzleDataCSV + "\n");
  }
  
  solvedPuzzleFileStream.end();
}