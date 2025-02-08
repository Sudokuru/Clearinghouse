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
 */
export function log(message: string, color?: COLORS): void {
  if (color) {
    console.log(`${color}[Clearinghouse] ${message}${COLORS.RESET}`);
  } else {
    console.log(`[Clearinghouse] ${message}`);
  }
}  