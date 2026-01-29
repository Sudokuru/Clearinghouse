import { CSVDrillFeed } from "../feeds/CSVDrillFeed";
import { SOLVED_DATA_DIR } from "../streams/StreamConstants";
import { Drill } from "../types/Drill";
import { assertOutputContains, cleanupAndExit } from "../utils/testing";

export async function testExportDrills(): Promise<void> {
  const solvedDrillFile: string = "testDrills.csv";

  const exportDrillsRun = Bun.spawn({
    cmd: ["sh", "-c", "echo 'y' | bun export_drills.ts"],
    env: {
      ...process.env,
      SOLVED_DRILL_FILE: solvedDrillFile,
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
    'Are these values correct? (y/n):',
  ];

  await assertOutputContains(exportDrillsOutput, expectedConfigOutput, "export_drills.ts");

  // Verify an exported file contains expected drill puzzle string
  const fileContent: string = await Bun.file("obvious_single_drills.ts").text();
  await assertOutputContains(
    fileContent,
    [
      "export const obvious_single_drills",
      "\"197568423852394167634172598763285914429716835581943276348629751915837642276451380\"",
    ],
    "obvious_single_drills.ts"
  );

  // Cleanup generated files
  const feed = new CSVDrillFeed(SOLVED_DATA_DIR + `${solvedDrillFile}`);
  const strategies = new Set<string>();
  let drill: Drill | null;
  while ((drill = await feed.next()) !== null) {
    strategies.add(drill.strategy.replace(/_drill$/, ""));
  }
  feed.close();
  for (const strategy of strategies) {
    await Bun.spawn({ cmd: ["rm", "-f", `${strategy}_drills.ts`] }).exited;
  }

  console.log("Test Export Drill Logs:\n" + exportDrillsOutput + "\n");
}