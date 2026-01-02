import { appendFileSync } from "node:fs";

export enum COLORS {
  GREEN = "\x1b[32m",
  RED = "\x1b[31m",
  YELLOW = "\x1b[33m",
  CYAN = "\x1b[36m",
  RESET = "\x1b[0m",
}
  
/**
 * Logs a message to the console.
 * If a color is provided, the message will be wrapped in the ANSI codes for that color.
 * Otherwise, it will log plain text.
 * @param message - The message to log.
 * @param color - Optional color from the COLORS enum.
 * @param file - Optional file to write log to, creates if does not exist else appends. Ignores color.
 * @param progress - If true, uses carriage return to overwrite the same line instead of creating a new line.
 */
export function log(
  message: string,
  color?: COLORS,
  file?: string,
  progress: boolean = false
): void {
  const pref = "[CH]";
  const colored = color ? `${color}${pref} ${message}${COLORS.RESET}` : `${pref} ${message}`;

  if (file) {
    try {
      appendFileSync(file, `${pref} ${message}\n`);
    } catch (error: any) {
      console.error(`${COLORS.RED}${pref} Failed to write to log file: ${error.message}${COLORS.RESET}`);
      console.log(`${pref} Message that failed to write: ${message}`);
    }
  } else if (progress) {
    // clear line then write
    process.stdout.write(`\r\x1b[K${colored}`);
  } else {
    console.log(colored);
  }
}

export function logProgressTwoLines(
  line1: string,
  line2: string,
  color: COLORS = COLORS.RESET
): void {
  const pref = "[CH]";
  const l1 = `${color}${pref} ${line1}${COLORS.RESET}`;
  const l2 = `${color}${pref} ${line2}${COLORS.RESET}`;
  // Clear line 1, write line 1, newline, clear line 2, write line 2, then move cursor up to line 1
  process.stdout.write(`\r\x1b[K${l1}\n\x1b[K${l2}\x1b[F`);
}


// Helper to format seconds -> HH:MM:SS
export const formatEta = (secs: number) => {
  const s = Math.max(0, Math.floor(secs));
  const h = Math.floor(s / 3600).toString().padStart(2, "0");
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${h}:${m}:${ss}`;
};