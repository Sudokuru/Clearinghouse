// Given a puzzle board string returns a SQL statement to insert the puzzle and associated data into the Puzzles table
// Example Usage: bun GenerateInsert.ts 439275618051896437876143592342687951185329746697451283928734165563912874714568329

import { getPuzzleData } from 'sudokuru';

const board = process.argv[2];
const data = getPuzzleData(board);

console.log("INSERT INTO Puzzles(puzzle, solution, difficulty) VALUES(\'" + board + "\', \'" + data.solution + "\', " + data.difficulty + ");");
