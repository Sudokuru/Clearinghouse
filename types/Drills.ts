import { z } from "zod";

// Define field names in fixed order (useful for exporting to csv)
export const DrillDataFields = [
  // strategy drill is for e.g. obvious_single
  "strategy",
  // puzzle string right before strategy can be used for drill, of course does not include
  // notes so solver must be used with given strategy as highest priority until it is found
  // so needed note simplifications are done
  "puzzle"
] as const;

// Create union of all possible values in array i.e. "strategy" | "puzzle"
type DrillField = typeof DrillDataFields[number];

// Build schema shape
const drillSchemaShape = Object.fromEntries(
  DrillDataFields.map((field) => [
    field,
    z.string()
  ])
) as unknown as Record<DrillField, z.ZodString>;

// Build Zod object schema
export const DrillDataSchema = z.object(drillSchemaShape);

// Create TS type from Zod schema
export type DrillData = z.infer<typeof DrillDataSchema>;

export class DrillKey {
  private strategy: string;
  private puzzle: string;

  constructor(strategy: string, puzzle: string) {
    this.strategy = strategy;
    this.puzzle = puzzle;
  }

  public toString = () : string => {
    return `drill:${this.strategy}:${this.puzzle}`;
  }
}

export interface Drill {
    // The Redis key, structured as prefix (e.g. 'drill:') followed by strategy then ':' then
    // the puzzle string with 0s for empty cells
    key: DrillKey;
    data: DrillData;
}

// Don't need to add 1 like with Puzzles cause the key is the data whereas puzzle data excludes
// the puzzle string which is the key
export const DrillFieldCount: number = Object.keys(DrillDataSchema.shape).length;