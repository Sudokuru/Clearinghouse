import { CSVDrillFeed } from "../feeds/CSVDrillFeed";
import { SOLVED_DATA_DIR } from "../streams/StreamConstants";
import { Drill } from "../types/Drill";
import { assertOutputContains, assertStringInArrayExactlyOnce, cleanupAndExit, getAttributeValueCountInDrills } from "../utils/testing";

export async function testIngestDrills(): Promise<void> {
  const maxDrillsPerStrategy: string = "2";
  const solvedPuzzleFile: string = "testPuzzles.csv";
  const solvedDrillFile: string = "testDrills.csv";
  
  const ingestDrillsRun = Bun.spawn({
    cmd: ["sh", "-c", "echo 'y' | bun ingest_drills.ts"],
    env: {
      ...process.env, // preserve env
      MAX_DRILLS_PER_STRATEGY: maxDrillsPerStrategy,
      SOLVED_PUZZLE_FILE: solvedPuzzleFile,
      SOLVED_DRILL_FILE: solvedDrillFile,
    },
    stdout: "pipe",
  });
  await ingestDrillsRun.exited;
  const ingestDrillsOutput: string = await new Response(ingestDrillsRun.stdout as ReadableStream<Uint8Array>).text();
  
  const expectedConfigOutput: string[] = [
    `Max Drills Per Strategy: ${maxDrillsPerStrategy}`,
    `Solved Puzzle File: ${solvedPuzzleFile}`,
    `Solved Drill File: ${solvedDrillFile}`,
    'Are these values correct? (y/n):'
  ]
  
  await assertOutputContains(ingestDrillsOutput, expectedConfigOutput, "ingest_drills.ts config");

  // Read drills we wrote to testDrills.csv
  const solved: CSVDrillFeed = new CSVDrillFeed(SOLVED_DATA_DIR + "testDrills.csv");
  const drills: Drill[] = [];
  let drill: Drill | null;
  while ((drill = await solved.next()) !== null) {
    drills.push(drill);
  }
  solved.close();
  const drillStrings: string[] = drills.map((d) => JSON.stringify(d));

  console.log("Drill data ingested during test:");
  console.log(drillStrings);

  // Verify presolved drill is in testDrills.csv and not duplicated
  const presolvedDrill: Drill = {
    strategy: "obvious_single_drill",
    initialPuzzle: "007500023850004060030102590700200010000710835080040076300620751915837042276000000",
    drillPuzzle: "197568423852394167634172598763285914429716835581943276348629751915837642276451380"
  }
  const presolvedDrillString = JSON.stringify(presolvedDrill);
  await assertStringInArrayExactlyOnce(drillStrings, presolvedDrillString);

  // Verify another drill from same puzzle is solved
  const pairDrill: Drill = {
    strategy: "obvious_pair_drill",
    initialPuzzle: "007500023850004060030102590700200010000710835080040076300620751915837042276000000",
    drillPuzzle: "197500423852394167634172598763200914429716835080040076300620751915837042276000000"
  }
  const pairDrillString = JSON.stringify(pairDrill);
  await assertStringInArrayExactlyOnce(drillStrings, pairDrillString);

  // Verify a drill from another puzzle is solved
  const singleDrill: Drill = {
    strategy: "obvious_single_drill",
    initialPuzzle: "406007021029000476107600380280706910500091000070000608305210807000300000018569243",
    drillPuzzle: "436987521829135476157642389283756914564891732971423658395214867642378195018569243"
  }
  const singleDrillString = JSON.stringify(singleDrill);
  await assertStringInArrayExactlyOnce(drillStrings, singleDrillString);

  // Verify max drill limit is not exceeded even though 3 obvious singles are available
  let count: number = getAttributeValueCountInDrills("strategy", "obvious_single_drill", drills);
  if (count > 2) {
    cleanupAndExit(`obvious_single_drill exceeded max drill limit of 2 with ${count} occurrences.`);
  } else if (count < 2) {
    cleanupAndExit(`Only ${count} obvious_single_drill occurrences were found vs expected 2.`);
  }

  // Verify found all drills for first puzzle
  count = getAttributeValueCountInDrills("initialPuzzle", "007500023850004060030102590700200010000710835080040076300620751915837042276000000", drills);
  if (count !== 5) {
    cleanupAndExit(`Found ${count} drills for first puzzle vs expected 5.`);
  }

  // Verify didn't find any pointing_triplet drills
  count = getAttributeValueCountInDrills("strategy", "pointing_triplet_drill", drills);
  if (count > 0) {
    cleanupAndExit(`Found ${count} pointing_triplet_drills vs expected 0.`);
  }

  console.log("Test Ingest Drill Logs:\n" + ingestDrillsOutput + "\n");
}