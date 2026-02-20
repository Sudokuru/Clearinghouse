import { assertOutputContains, cleanupAndExit } from "../utils/testing";

export async function testExportDrills(): Promise<void> {
  const solvedDrillFile: string = "testDrills.csv";
  const outputDir: string = "test_exported_drills";
  await Bun.spawn({ cmd: ["rm", "-rf", outputDir] }).exited;

  const exportDrillsRun = Bun.spawn({
    cmd: ["sh", "-c", "echo 'y' | bun export_drills.ts"],
    env: {
      ...process.env,
      SOLVED_DRILL_FILE: solvedDrillFile,
      OUTPUT_DIR: outputDir,
    },
    stdout: "pipe",
  });
  const exitCode = await exportDrillsRun.exited;
  const exportDrillsOutput: string = await new Response(exportDrillsRun.stdout as ReadableStream<Uint8Array>).text();
  if (exitCode !== 0) {
    const err = exportDrillsRun.stderr ? await new Response(exportDrillsRun.stderr as ReadableStream<Uint8Array>).text() : "";
    await cleanupAndExit(`export_drills.ts exited with code ${exitCode}\n${err}`);
  }

  const expectedConfigOutput: string[] = [
    `Solved Drill File: ${solvedDrillFile}`,
    `Output Directory: ${outputDir}`,
    'Are these values correct? (y/n):',
  ];

  await assertOutputContains(exportDrillsOutput, expectedConfigOutput, "export_drills.ts");

  // Verify an exported file contains expected drill puzzle string
  const fileContent: string = await Bun.file(`${outputDir}/obvious_single_drills.ts`).text();
  await assertOutputContains(
    fileContent,
    [
      "export const OBVIOUS_SINGLE_DRILLS",
      "\"197568423852394167634172598763285914429716835581943276348629751915837642276451380\"",
    ],
    `${outputDir}/obvious_single_drills.ts`
  );

  // Verify existing output directory causes early exit
  const secondRun = Bun.spawn({
    cmd: ["sh", "-c", "echo 'y' | bun export_drills.ts"],
    env: {
      ...process.env,
      SOLVED_DRILL_FILE: solvedDrillFile,
      OUTPUT_DIR: outputDir,
    },
    stdout: "pipe",
  });
  const secondExitCode = await secondRun.exited;
  const secondOutput: string = await new Response(secondRun.stdout as ReadableStream<Uint8Array>).text();
  if (secondExitCode === 0) {
    await cleanupAndExit("export_drills.ts should exit non-zero when OUTPUT_DIR already exists.");
  }
  await assertOutputContains(secondOutput, [`[CH] Output directory already exists: ${outputDir}. Exiting.`], "export_drills.ts second run");

  // Cleanup generated files
  await Bun.spawn({ cmd: ["rm", "-rf", outputDir] }).exited;

  console.log("Test Export Drill Logs:\n" + exportDrillsOutput + "\n");
}
