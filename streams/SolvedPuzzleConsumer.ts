import { RedisClientType } from "redis";
import { log } from "../utils/logs";
import { createWriteStream } from "fs";
import { NEW_SOLVED_SET } from "./StreamConstants";
import { getPuzzleDataFromRedis } from "../utils/redis";
import { PuzzleDataFields } from "../types/Puzzle";
import { checkIfFileEndsWithoutNewline } from "../utils/helpers";

// Constants
const SOLVED_DIRECTORY: string = "data/solved/";

/**
 * Reads newly solved puzzles from Redis set and appends them to solved puzzle file
 * @param client - Redis client to read set using
 * @param solvedPuzzleFile - file to append solved puzzles to (in SOLVED_DIRECTORY)
 */
export async function consumeSolvedPuzzles(client: RedisClientType, solvedPuzzleFile: string) {
  log("Starting to consume solved puzzles...");

  const filePath = SOLVED_DIRECTORY + solvedPuzzleFile;

  // Check if file exists and whether it ends without a newline
  let needsNewline = await checkIfFileEndsWithoutNewline(filePath);

  // Open solved puzzles CSV file in append mode
  const solvedPuzzleFileStream = createWriteStream(filePath, { flags: "a" });

  // If needed, write a leading newline so our first append starts on a new line
  if (needsNewline) {
    solvedPuzzleFileStream.write("\n");
  }

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