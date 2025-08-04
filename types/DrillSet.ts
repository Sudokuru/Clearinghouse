import { Drill } from "./Drill";

// Wrapper for Drill array and a set to be used to prevent duplicates from being added
// Also has drillCounts to store number of drills per strategy in set
export type DrillSet = {
    drills: Drill[];
    seenDrill: Set<string>;
    drillCounts: Map<string, number>;
};

// If provided drill not already in set then it adds it
export function addDrill(set: DrillSet, drill: Drill) {
    const key = drill.strategy + ":" + drill.drillPuzzle;
    if (!set.seenDrill.has(key)) {
        set.drills.push(drill);
        set.drillCounts.set(drill.strategy, (set.drillCounts.get(drill.strategy) ?? 0) + 1);
        set.seenDrill.add(key);
    }
}