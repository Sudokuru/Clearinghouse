import { z } from "zod";

export const PuzzleDataSchema = z.object({
  // solution: 81 character puzzle solution string
  solution: z.string(),
  // difficulty: Integer difficulty metric as determined by Sudokuru npm package
  difficulty: z.number(),
  // A drill is when you can search and find exactly one occurrence of a strategy at
  // a particular point in a puzzle
  // Last occurrence of each drill when solving puzzle using nextStep function
  // from Sudokuru package repeatedly until their are that many cells filled in
  // i.e. 80 is last move
  // If drill never occurrs in puzzle then value is set to -1
  obvious_single_drill: z.number(),
  hidden_single_drill: z.number(),
  obvious_pair_drill: z.number(),
  hidden_pair_drill: z.number(),
  pointing_pair_drill: z.number(),
  obvious_triplet_drill: z.number(),
  hidden_triplet_drill: z.number(),
  pointing_triplet_drill: z.number(),
  obvious_quadruplet_drill: z.number(),
  hidden_quadruplet_drill: z.number()
});

export type PuzzleData = z.infer<typeof PuzzleDataSchema>;


export class PuzzleKey {
  private puzzle: string;
  private solved: boolean;

  constructor(puzzle: string, solved: boolean) {
    this.puzzle = puzzle;
    this.solved = solved;
  }

  public toString = () : string => {
    if (this.solved) {
      return `solved:${this.puzzle}`;
    } else {
      return `${this.puzzle}`;
    }
  }
}

export interface Puzzle {
  // The Redis key, structured as prefix (e.g. 'solved:') followed by 81 character
  // puzzle string with 0s for empty cells
  key: PuzzleKey;
  data: PuzzleData;
}

// Added 1 to account for puzzle string (Redis key)
export const PuzzleFieldCount: number = Object.keys(PuzzleDataSchema.shape).length + 1;

// For parsing this: https://github.com/Sudokuru/Sudokuru/blob/main/lib/PuzzleData.ts
export interface SudokuruPuzzleData {
  solution: string;
  difficulty: number;
  drills: number[];
}