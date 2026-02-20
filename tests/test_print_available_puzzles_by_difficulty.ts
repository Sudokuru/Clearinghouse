import { assertOutputContains, cleanupAndExit } from "../utils/testing";

export async function testPrintAvailablePuzzlesByDifficulty(): Promise<void> {
  const solvedPuzzleFile = "testPuzzles.csv";

  const run = Bun.spawn({
    cmd: ["sh", "-c", "echo 'y' | bun print_available_puzzles_by_difficulty.ts"],
    env: {
      ...process.env,
      SOLVED_PUZZLE_FILE: solvedPuzzleFile,
    },
    stdout: "pipe",
  });
  const exitCode = await run.exited;
  const output: string = await new Response(run.stdout as ReadableStream<Uint8Array>).text();
  if (exitCode !== 0) {
    const err = run.stderr ? await new Response(run.stderr as ReadableStream<Uint8Array>).text() : "";
    await cleanupAndExit(`print_available_puzzles_by_difficulty.ts exited with code ${exitCode}\n${err}`);
  }

  await assertOutputContains(
    output,
    [
      `Solved Puzzle File: ${solvedPuzzleFile}`,
      "Are these values correct? (y/n):",
      "[CH] Novice: 0",
      "[CH] Grandmaster: 0",
      "[CH] Minimum puzzles available for any difficulty: 0",
    ],
    "print_available_puzzles_by_difficulty.ts"
  );

  console.log("Test Print Available Puzzles By Difficulty Logs:\n" + output + "\n");
}
