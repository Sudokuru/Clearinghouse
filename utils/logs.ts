import { appendFileSync } from "node:fs";

export enum COLORS {
  GREEN = "\x1b[32m",
  RED = "\x1b[31m",
  YELLOW = "\x1b[33m",
  RESET = "\x1b[0m",
}
  
/**
 * Logs a message to the console.
 * If a color is provided, the message will be wrapped in the ANSI codes for that color.
 * Otherwise, it will log plain text.
 * @param message - The message to log.
 * @param color - Optional color from the COLORS enum.
 * @param file - Optional file to write log to, creates if does not exist else appends. Ignores color.
 */
export function log(message: string, color?: COLORS, file?: string): void {
  if (file) {
    try {
      appendFileSync(file, `[Clearinghouse] ${message}\n`);
    } catch (error) {
      console.error(`${COLORS.RED}[Clearinghouse] Failed to write to log file with error: ${error.message}${COLORS.RESET}`);
      console.log(`[Clearinghouse] Message that failed to write:  ${message}`);
    }
  } else if (color) {
    console.log(`${color}[Clearinghouse] ${message}${COLORS.RESET}`);
  } else {
    console.log(`[Clearinghouse] ${message}`);
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