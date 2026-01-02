import { describe, it, expect } from "bun:test";
import { RedisContainer } from "@testcontainers/redis";
import { createClient } from "redis";
import { UNSOLVED_STREAM, UNSOLVED_CONSUMER_GROUP, NEW_SOLVED_SET, ALREADY_SOLVED_SET, FAILED_SOLVE_SET } from "./streams/StreamConstants";

// https://github.com/oven-sh/bun/discussions/21953
// bun test is not working with testcontainers.


// todo move this into start
export function formatEta(secs: number): string {
  const s = Math.max(0, Math.floor(secs));
  const h = Math.floor(s / 3600).toString().padStart(2, "0");
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${h}:${m}:${ss}`;
}

export function buildProgressLines(opts: {
  pending: number;
  lag: number;
  totalToSolve: number;
  puzzleCount: number;
  newSolved: number;
  alreadySolved: number;
  failedSolve: number;
  startTime: number;
  processesLength: number;
  aliveThreads: number;
  now?: number;
}) {
  const {
    pending,
    lag,
    totalToSolve,
    puzzleCount,
    newSolved,
    alreadySolved,
    failedSolve,
    startTime,
    processesLength,
    aliveThreads,
    now = Date.now(),
  } = opts;

  const remaining = Math.max(0, pending + lag);
  const processed = Math.max(0, totalToSolve - remaining);
  const percentage =
    totalToSolve === 0 ? "100.00" : ((processed / totalToSolve) * 100).toFixed(2);

  const remainingToSolve = puzzleCount - (newSolved + alreadySolved + failedSolve);

  const elapsedSecs = Math.max(0, (now - startTime) / 1000);
  const rate = processed > 0 && elapsedSecs > 0 ? processed / elapsedSecs : 0;
  const etaSecs = rate > 0 ? remaining / rate : 0;
  const eta = rate > 0 ? formatEta(etaSecs) : "estimating...";

  const line1 = `Progress: ${processed}/${totalToSolve} (${percentage}%) | ETA ${eta} | Threads: ${aliveThreads}/${processesLength}`;
  const line2 = `Stats - New: ${newSolved} | Already: ${alreadySolved} | Failed: ${failedSolve} | Remaining: ${remainingToSolve}/${puzzleCount}`;

  return { line1, line2, eta, remaining, processed, remainingToSolve };
}

describe.skip("progress math integration", () => {
  it("computes progress/ETA from real Redis state", async () => {
    const container = await new RedisContainer("redis:7.2.4").start();
    const client = createClient({
      socket: { host: container.getHost(), port: container.getMappedPort(6379) },
    });
    await client.connect();

    await client.del([UNSOLVED_STREAM, NEW_SOLVED_SET, ALREADY_SOLVED_SET, FAILED_SOLVE_SET]);
    try { await client.sendCommand(["XGROUP", "DESTROY", UNSOLVED_STREAM, UNSOLVED_CONSUMER_GROUP]); } catch {}

    await client.sendCommand(["XGROUP", "CREATE", UNSOLVED_STREAM, UNSOLVED_CONSUMER_GROUP, "$", "MKSTREAM"]);
    for (let i = 0; i < 5; i++) await client.xAdd(UNSOLVED_STREAM, "*", { puzzleKey: `p${i}` });
    // consume 2 -> pending=2, lag=3
    await client.xReadGroup(UNSOLVED_CONSUMER_GROUP, "c1", { key: UNSOLVED_STREAM, id: ">" }, { COUNT: 2 });

    await client.sAdd(NEW_SOLVED_SET, "p0");
    await client.sAdd(ALREADY_SOLVED_SET, "p1");
    await client.sAdd(FAILED_SOLVE_SET, "p2");

    const raw = await client.sendCommand(["XINFO", "GROUPS", UNSOLVED_STREAM]) as any[];
    const g = Array.isArray(raw) && raw.length ? raw[0] : [];
    const getNum = (k: string) => { const i = g.indexOf(k); return i >= 0 ? Number(g[i + 1]) || 0 : 0; };
    const pending = getNum("pending");
    const lag = getNum("lag");

    const { line1, line2, processed, remainingToSolve, eta } = buildProgressLines({
      pending,
      lag,
      totalToSolve: 5,
      puzzleCount: 5,
      newSolved: 1,
      alreadySolved: 1,
      failedSolve: 1,
      startTime: 0,
      now: 2000 * 1000, // 2000s later
      processesLength: 4,
      aliveThreads: 3,
    });

    expect(processed).toBe(5 - (pending + lag)); // 0 here
    expect(remainingToSolve).toBe(2);            // 5 - (1+1+1)
    expect(line1).toContain("Progress: 0/5 (0.00%)");
    expect(line1).toContain("Threads: 3/4");
    expect(eta).toBe("estimating...");           // rate=0
    expect(line2).toContain("New: 1");
    expect(line2).toContain("Already: 1");
    expect(line2).toContain("Failed: 1");
    expect(line2).toContain("Remaining: 2/5");

    await client.quit();
    await container.stop();
  });
});