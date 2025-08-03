export interface Drill {
    // Strategy is the drill uses
    // Initial puzzle is the initial state of the puzzle where the drill was found
    // Drill puzzle is the state of the puzzle (excluding notes) right before the drill is used
    strategy: string;
    initialPuzzle: string;
    drillPuzzle: string;
}

export const DrillFieldCount: number = 3; // strategy + initial puzzle + drill puzzle