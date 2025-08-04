import { assertOutputContains } from "../utils/testing";

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
}