// Given a puzzle board string returns a SQL statement to insert the puzzle and associated data into the Puzzles table
// Example Usage: bun GenerateInsert.ts 439275618051896437876143592342687951185329746697451283928734165563912874714568329

import { getPuzzleData } from 'sudokuru';

const board = process.argv[2];
const data = getPuzzleData(board);
const drills = data.drills;

let sqlInsert:string = "INSERT INTO Puzzles(puzzle, solution, difficulty, ";
sqlInsert += "naked_single_drill, hidden_single_drill, naked_pair_drill, hidden_pair_drill, ";
sqlInsert += "pointing_pair_drill, naked_triplet_drill, hidden_triplet_drill, pointing_triplet_drill, ";
sqlInsert += "naked_quadruplet_drill, hidden_quadruplet_drill)";
sqlInsert += " VALUES(\'" + board + "\', \'" + data.solution + "\', " + data.difficulty;
sqlInsert += ", " + drills[0] + ", " + drills[1] + ", " + drills[2] + ", " + drills[3];
sqlInsert += ", " + drills[4] + ", " + drills[5] + ", " + drills[6] + ", " + drills[7];
sqlInsert += ", " + drills[8] + ", " + drills[9] + ");";

console.log(sqlInsert);