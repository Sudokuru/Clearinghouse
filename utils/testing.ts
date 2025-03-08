import { COLORS, log } from "./logs";
import { clearRedis } from "./redis";

/**
 * Takes in string output, list of substrings that should be contained in output, and test name
 * If a substring is not found in output then test failure is loggged, output is logged,
 * redis is cleared, and test process is exited. Otherwise, returns void.
 */
export async function assertOutputContains(output: string, contained: string[], name: string): Promise<void> {
  for (const substring of contained) {
    if (!output.includes(substring)) {
      log(`❌ ${name} test failed: expected log message not found in captured logs.`, COLORS.RED);
      log(`Captured logs: ${output}`);
      await clearRedis();
      process.exit(1);
    }
  }
}