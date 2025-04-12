import { Subprocess } from "bun";
import { COLORS, log } from "./logs";
import { PuzzleData, PuzzleDataSchema, PuzzleKey } from "../types/Puzzle";
import { RedisClientType } from "redis";

const CONTAINER_NAME = "sudoku-redis";
const SUCCESS_CODE = 0;
const RETRY_COUNT: number = 5;
const RETRY_DELAY: number = 1000; // milliseconds
export const SUCCESS_CONNECT_MSG = "Successfully connected to Redis.";
export const CLEAR_REDIS_MSG = "🧹 Cleared the Redis Database 🗑️";
export const QUIT_REDIS_MSG = "Redis connection closed. Exiting.";

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
    cmd: ["docker", "run", "--name", CONTAINER_NAME, "-d", "-p", "6379:6379", "redis:7.4"],
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
  if (startExitCode === SUCCESS_CODE) {
    const seconds = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`Redis Docker restarted successfully in ${seconds} seconds.`, COLORS.GREEN);
    return true;
  } else {
    log("Redis Docker failed to start.", COLORS.RED);
    return false;
  }
}

/**
 * Stops the Redis Docker container
 * Returns true if the container stopped successfully, otherwise false.
 */
export async function stopRedis(): Promise<boolean> {
  log("Stopping Redis Docker...", COLORS.YELLOW);
  const startTime = Date.now();

  // Try to stop Redis Docker container.
  const dockerStop = Bun.spawn({
    cmd: ["docker", "stop", CONTAINER_NAME],
    stdout: "inherit",
    stderr: "inherit",
  });

  const exitCode = await dockerStop.exited;

  if (exitCode === SUCCESS_CODE) {
    const seconds = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`Redis Docker stopped successfully in ${seconds} seconds.`, COLORS.GREEN);
    return true;
  }
  return false;
}

/**
 * Attempts to connect to Redis using retries
 * Throws error if fails to connect
 * Retries usually only needed if docker is not already running
 */
export async function connectToRedis(client: RedisClientType): Promise<void> {
  for (let i = 0; i < RETRY_COUNT; i++) {
    try {
      await Promise.race([
        client.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Connection timed out")), RETRY_DELAY)
        )
      ]);
      log(SUCCESS_CONNECT_MSG, COLORS.GREEN);
      return;
    } catch (err: any) {
      log(`Connection attempt ${i + 1} failed: ${err.message}. Retrying in ${RETRY_DELAY}ms...`, COLORS.YELLOW);

      // If the error indicates that the socket is already open, disconnect it.
      if (err.message.includes("Socket already opened")) {
        try {
          await client.disconnect();
          log("Disconnected the lingering socket.", COLORS.YELLOW);
        } catch (disconnectErr: any) {
          log(`Error disconnecting socket: ${disconnectErr.message}`, COLORS.RED);
        }
      }
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
  throw new Error("Could not connect to Redis after several retries.");
}

/**
 * Clears the Redis database
 */
export async function clearRedis(): Promise<Subprocess> {
  const clearRun = Bun.spawn({
    cmd: ["bun", "clear.ts"],
    stdout: "pipe",
  });
  const exitCode = await clearRun.exited;
  if (exitCode !== SUCCESS_CODE) {
    const stderr = await new Response(clearRun.stderr).text();
    log(`Failed to clear Redis: ${stderr}`, COLORS.RED);
  }
  return clearRun;
}

/**
 * Returns PuzzleData object with data from solved Redis key if available for given puzzle string
 * Else returns null
 */
export async function getPuzzleDataFromRedis(client: RedisClientType, puzzle: string): Promise<PuzzleData | null> {
  const data = await client.hGetAll(new PuzzleKey(puzzle, true).toString());

  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  // Validate and parse data from Redis using zod schema
  const parsed = PuzzleDataSchema.safeParse(data);

  if (!parsed.success) {
    log(`❌ failed to parse puzzle data from Redis.`, COLORS.RED);
    return null;
  }

  return parsed.data;
}