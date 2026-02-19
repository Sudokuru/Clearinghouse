import { CSVDrillFeed } from "../feeds/CSVDrillFeed";
import { SOLVED_DATA_DIR } from "../streams/StreamConstants";
import { Drill } from "../types/Drill";
import { assertOutputContains, cleanupAndExit } from "../utils/testing";

export async function testIngestDrillsMissingCsv(): Promise<void> {
  const maxDrillsPerStrategy = "1";
  const solvedPuzzleFile = "testPuzzles.csv";
  const solvedDrillFile = "testMissingDrills.csv";
  const solvedDrillPath = SOLVED_DATA_DIR + solvedDrillFile;

  await Bun.spawn({ cmd: ["rm", "-f", solvedDrillPath] }).exited;

  const ingestDrillsRun = Bun.spawn({
    cmd: ["sh", "-c", "echo 'y' | bun ingest_drills.ts"],
    env: {
      ...process.env,
      MAX_DRILLS_PER_STRATEGY: maxDrillsPerStrategy,
      SOLVED_PUZZLE_FILE: solvedPuzzleFile,
      SOLVED_DRILL_FILE: solvedDrillFile,
    },
    stdout: "pipe",
  });
  const exitCode = await ingestDrillsRun.exited;
  const ingestDrillsOutput: string = await new Response(ingestDrillsRun.stdout as ReadableStream<Uint8Array>).text();
  if (exitCode !== 0) {
    const err = ingestDrillsRun.stderr ? await new Response(ingestDrillsRun.stderr as ReadableStream<Uint8Array>).text() : "";
    await cleanupAndExit(`ingest_drills.ts exited with code ${exitCode}\n${err}`);
  }

  const expectedConfigOutput: string[] = [
    `Max Drills Per Strategy: ${maxDrillsPerStrategy}`,
    `Solved Puzzle File: ${solvedPuzzleFile}`,
    `Solved Drill File: ${solvedDrillFile}`,
    "Are these values correct? (y/n):",
  ];
  await assertOutputContains(ingestDrillsOutput, expectedConfigOutput, "ingest_drills.ts missing csv");

  const solved = new CSVDrillFeed(solvedDrillPath);
  const drills: Drill[] = [];
  let drill: Drill | null;
  while ((drill = await solved.next()) !== null) {
    drills.push(drill);
  }
  solved.close();

  if (drills.length === 0) {
    await cleanupAndExit("Expected ingest_drills.ts to create at least one drill when CSV is initially missing.");
  }

  await Bun.spawn({ cmd: ["rm", "-f", solvedDrillPath] }).exited;
  console.log("Test Ingest Drills Missing CSV Logs:\n" + ingestDrillsOutput + "\n");
}
