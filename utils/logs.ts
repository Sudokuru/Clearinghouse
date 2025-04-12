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
    appendFileSync(file, `[Clearinghouse] ${message}\n`);
  } else if (color) {
    console.log(`${color}[Clearinghouse] ${message}${COLORS.RESET}`);
  } else {
    console.log(`[Clearinghouse] ${message}`);
  }
}