// Redis stream keys and groups
export const UNSOLVED_CONSUMER_GROUP: string = "unsolved:group";
export const UNSOLVED_STREAM: string = "unsolved";
export const NEW_SOLVED_SET: string = "new:solved:puzzles";
export const ALREADY_SOLVED_SET: string = "already:solved:puzzles";
export const FAILED_SOLVE_SET: string = "failed:solve:puzzles";

// File paths
export const DEFAULT_SOLVED_PUZZLES_FILE = "puzzles.csv";