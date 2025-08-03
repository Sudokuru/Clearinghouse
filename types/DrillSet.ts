import { Drill } from "./Drill";

// Wrapper for Drill array and a set to be used to prevent duplicates from being added
export type DrillSet = {
    drills: Drill[];
    seenDrill: Set<string>;
};

// If provided drill not already in set then it adds it
export function addDrill(set: DrillSet, drill: Drill) {
    const key = drill.strategy + ":" + drill.drillPuzzle;
    if (!set.seenDrill.has(key)) {
        set.drills.push(drill);
        set.seenDrill.add(key);
    }
}