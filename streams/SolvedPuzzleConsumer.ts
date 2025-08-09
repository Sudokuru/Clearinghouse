import { RedisClientType } from "redis";
import { log } from "../utils/logs";
import { WriteStream } from "fs";
import { NEW_SOLVED_SET, SOLVED_DATA_DIR } from "./StreamConstants";
import { getPuzzleDataFromRedis } from "../utils/redis";
import { PuzzleDataFields } from "../types/Puzzle";
import { getWriteStream } from "../utils/helpers";

/**
 * Reads newly solved puzzles from Redis set and appends them to solved puzzle file
 * @param client - Redis client to read set using
 * @param solvedPuzzleFile - file to append solved puzzles to (in SOLVED_DIRECTORY)
 */
export async function consumeSolvedPuzzles(client: RedisClientType, solvedPuzzleFile: string) {
  log("Starting to consume solved puzzles...");

  const filePath = SOLVED_DATA_DIR + solvedPuzzleFile;

  const solvedPuzzleFileStream: WriteStream = await getWriteStream(filePath);

  // Pop newly solved puzzles off Redis set and append them to solved puzzles CSV file
  let puzzleStrArr: string[];
  while (
    (puzzleStrArr = await client.sPop(NEW_SOLVED_SET)) !== null &&
    puzzleStrArr.length !== 0
  ) {
    const puzzleStr: string = puzzleStrArr.toString();
    const puzzleData = await getPuzzleDataFromRedis(client, puzzleStr);
    if (puzzleData === null) {
      continue;
    }
    const puzzleDataCSV = PuzzleDataFields.map((key) => puzzleData[key]).join(",");
    // each append ends with a single '\n'
    solvedPuzzleFileStream.write(puzzleStr + "," + puzzleDataCSV + "\n");
  }

  solvedPuzzleFileStream.end();
}