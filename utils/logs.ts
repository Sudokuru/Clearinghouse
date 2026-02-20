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

/**
 * Logs provided values and prompts user to confirm they are correct
 * If user does not confirm they are correct then exits the program
 * @param values - Name, value pairs to log for the user to confirm
 */
export function promptUserToConfirmValues(values: Record<string, unknown>): void {
  // Log name, value pairs for the user to confirm
  log("Configuration Values:");
  for (const [name, value] of Object.entries(values)) {
    log(`${name}: ${value}`);
  }

  // Prompt the user to confirm the configuration.
  const answer = prompt("\nAre these values correct? (y/n): ");

  // If the answer is not 'y' (ignoring case), exit the process.
  if (answer?.toLowerCase() !== "y") {
    log("Configuration not confirmed. Exiting...", COLORS.RED);
    process.exit(1);
  }
}

/*
 * Logs two lines of progress to the console.
 * The first line is written, followed by the second line, and the cursor is moved back to the first line.
 * This is useful for displaying progress updates on two lines without creating additional lines in the console.
 * 
 * @param line1 - The first line of the progress message.
 * @param line2 - The second line of the progress message.
 * @param color - Optional color from the COLORS enum. Defaults to no color.
 */
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


/**
 * Formats a given number of seconds into a human-readable time string in the format HH:MM:SS.
 * 
 * @param secs - The number of seconds to format. If negative, it will be treated as 0.
 * @returns A string representing the formatted time in HH:MM:SS.
 */
export const formatEta = (secs: number): string => {
  const SECONDS_IN_HOUR = 3600;
  const SECONDS_IN_MINUTE = 60;
  const TIME_STRING_LENGTH = 2; // Desired length for time components (e.g., "01", "09")

  const s = Math.max(0, Math.floor(secs));
  const h = Math.floor(s / SECONDS_IN_HOUR).toString().padStart(TIME_STRING_LENGTH, "0");
  const m = Math.floor((s % SECONDS_IN_HOUR) / SECONDS_IN_MINUTE).toString().padStart(TIME_STRING_LENGTH, "0");
  const ss = (s % SECONDS_IN_MINUTE).toString().padStart(TIME_STRING_LENGTH, "0");
  return `${h}:${m}:${ss}`;
};
