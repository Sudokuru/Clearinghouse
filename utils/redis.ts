import { COLORS, log } from "./logs";

const CONTAINER_NAME = "sudoku-redis";
const SUCCESS_CODE = 0;

/**
 * Starts the Redis Docker container.
 * - If the container doesn't exist, it runs a new container.
 * - If the container already exists, it attempts to restart it.
 * Returns true if the container started or restarted successfully, otherwise false.
 */
export async function startRedis(): Promise<boolean> {
  log("Starting Redis Docker...", COLORS.YELLOW);
  const startTime = Date.now();

  // Try to run a new Redis Docker container.
  const dockerRun = Bun.spawn({
    cmd: ["docker", "run", "--name", CONTAINER_NAME, "-d", "-p", "6379:6379", "redis"],
    stdout: "inherit",
    stderr: "inherit",
  });

  const exitCode = await dockerRun.exited;

  if (exitCode === SUCCESS_CODE) {
    const seconds = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`Redis Docker started successfully in ${seconds} seconds.`, COLORS.GREEN);
    return true;
  }

  log(`${CONTAINER_NAME} already exists, attempting restart...`, COLORS.YELLOW);
  const dockerStart = Bun.spawn({
    cmd: ["docker", "start", CONTAINER_NAME],
    stdout: "inherit",
    stderr: "inherit",
  });
  const startExitCode = await dockerStart.exited;
  if (startExitCode === 0) {
    const seconds = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`Redis Docker restarted successfully in ${seconds} seconds.`, COLORS.GREEN);
    return true;
  } else {
    log("Redis Docker failed to start.", COLORS.RED);
    return false;
  }
}
