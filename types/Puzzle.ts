export interface PuzzleData {
    // 81 character puzzle solution string
    solution: string;
    // Integer difficulty metric as determined by Sudokuru npm package
    difficulty: number;
    // A drill is when you can search and find exactly one occurrence of a strategy at
    // a particular point in a puzzle
    // Last occurrence of each drill when solving puzzle using nextStep function
    // from Sudokuru package repeatedly until their are that many cells filled in
    // i.e. 80 is last move
    // If drill never occurrs in puzzle then value is set to -1
    naked_single_drill: number;
    hidden_single_drill: number;
    naked_pair_drill: number;
    hidden_pair_drill: number;
    pointing_pair_drill: number;
    naked_triplet_drill: number;
    hidden_triplet_drill: number;
    pointing_triplet_drill: number;
    naked_quadruplet_drill: number;
    hidden_quadruplet_drill: number;
}

export interface Puzzle {
    // The Redis key, structured as prefix (e.g. 'solved:') followed by 81 character
    // puzzle string with 0s for empty cells
    key: string;
    data: PuzzleData;
}