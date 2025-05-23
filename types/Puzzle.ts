import { z } from "zod";

// Define field names in fixed order (useful for exporting to csv)
export const PuzzleDataFields = [
  // solution: 81 character puzzle solution string
  "solution",
  // difficulty: Integer difficulty metric as determined by Sudokuru npm package
  "difficulty",
  // A drill is when you can search and find exactly one occurrence of a strategy at
  // a particular point in a puzzle
  // Last occurrence of each drill when solving puzzle using nextStep function
  // from Sudokuru package repeatedly until their are that many cells filled in
  // i.e. 80 is last move
  // If drill never occurs in puzzle then value is set to -1
  "obvious_single_drill",
  "hidden_single_drill",
  "obvious_pair_drill",
  "hidden_pair_drill",
  "pointing_pair_drill",
  "obvious_triplet_drill",
  "hidden_triplet_drill",
  "pointing_triplet_drill",
  "obvious_quadruplet_drill",
  "hidden_quadruplet_drill"
] as const;

// Create union of all possible values in array i.e. "solution" | "difficulty" | ...
type PuzzleField = typeof PuzzleDataFields[number];

// Build schema shape
const puzzleSchemaShape = Object.fromEntries(
  PuzzleDataFields.map((field) => [
    field,
    field === "solution" ? z.string() : z.coerce.number()
  ])
) as unknown as Record<PuzzleField, z.ZodTypeAny>;

// Build Zod object schema
export const PuzzleDataSchema = z.object(puzzleSchemaShape);

// Create TS type from Zod schema
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